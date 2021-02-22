import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { ElectronService } from "../core/services";

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const XLSX = require("xlsx");
const xpath_send_button =
  "/html/body/div[1]/div[1]/div/div[4]/div/footer/div[1]/div[3]/button";
const xpath_text_box = '//*[@id="main"]/footer/div[1]/div[2]/div/div[2]';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  mensaje: any;
  imagen: any;
  video: any;

  statusMensaje = true;
  statusImagen = false;
  statusVideo = false;

  constructor(
    private router: Router,
    private electronService: ElectronService
  ) {}

  ngOnInit(): void {
    try {
      if (!this.electronService.fs.existsSync("D:/contactos.xlsx")) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No existe el archivo contactos.xlsx ",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `${error}`,
      });
    }
  }

  start = async () => {
    var workbook = XLSX.readFile("D:/contactos.xlsx");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const contactos = [];

    for (let z in worksheet) {
      if (z.toString()[0] === "A") {
        contactos.push(worksheet[z].v);
      }
    }

    const browser = await puppeteer.launch({
      executablePath:
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      headless: false,
      userDataDir: "data/user_data",
    });
    const [page] = await browser.pages();
    await page.goto("http://web.whatsapp.com");
    await page.waitForSelector("._1awRl", { timeout: 60000 });

    console.log("logged in");

    for (const contact of contactos) {
      const mensaje = this.mensaje;
      let content = encodeURI(mensaje);
      await page.goto(
        "https://web.whatsapp.com/send?phone=" + contact + "&text=" + content
      );
      await page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      try {
        await page.waitForXPath(xpath_text_box);
      } catch (error) {
        console.log(error);
        return;
      }

      const [send_button] = await page.$x(xpath_send_button);
      await send_button.click();
      await page.waitFor(500);

      if (this.statusImagen) {
        const xpath_attach_box =
          '//*[@id="main"]/footer/div[1]/div[1]/div[2]/div/div/span';
        const [span_button] = await page.$x(xpath_attach_box);
        await span_button.click();

        const elementHandle = await page.$("input[type='file']");
        await elementHandle.uploadFile(this.imagen);
        await elementHandle.press("Enter");

        await page.waitFor(3000);
        const xpath_enviar =
          '//*[@id="app"]/div/div/div[2]/div[2]/span/div/span/div/div/div[2]/span/div/div/span';
        const [enviar_button] = await page.$x(xpath_enviar);
        await enviar_button.click(); 
      }
      if (this.statusVideo) {
        await page.waitFor(5000);
        const xpath_attach_box2 =
          '//*[@id="main"]/footer/div[1]/div[1]/div[2]/div/div/span';
        const [span_button2] = await page.$x(xpath_attach_box2);
        await span_button2.click();

        const elementHandle2 = await page.$("input[type='file']");
        await elementHandle2.uploadFile(this.video);
        await elementHandle2.press("Enter");

        await page.waitFor(3000);
        const xpath_enviar2 =
          '//*[@id="app"]/div/div/div[2]/div[2]/span/div/span/div/div/div[2]/span/div/div/span';
        const [enviar_button2] = await page.$x(xpath_enviar2);
        await enviar_button2.click();
        await page.waitFor(14000);     
      }
      await page.waitFor(7000);
      console.log("success send message to " + contact);
    }

    console.log("done");
    await page.waitFor(1000);
    browser.close()
    this.limpiar();
  };

  iniciar(): any {
    if(!this.mensaje){
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: `Ingrese mensaje a enviar`,
      });
      return;
    }
    if (this.statusImagen) {
      if(!this.imagen){
        Swal.fire({
          icon: "info",
          title: "Oops...",
          text: `Seleccione imágen`,
        });
        return;
      }
    }
    if (this.statusVideo) {
      if(!this.video){
        Swal.fire({
          icon: "info",
          title: "Oops...",
          text: `Seleccione video`,
        });
        return;
      }
    }
    this.start().then(() =>{
      this.limpiar();
    }).catch(err => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `${err}`,
      });
    });
  }

  changeStatusImagen(estado) {
    this.imagen = null;
    this.statusImagen = !estado;
  }

  changeStatusVideo(estado) {
    this.video = null;
    this.statusVideo = !estado;
  }

  uploadImage(e) {
    const file = e.target.files[0];
    const myVal = file.path.replace(/\\/g, "/");
    this.imagen = myVal;
  }

  uploadVideo(e) {
    const file = e.target.files[0];
    const myVal = file.path.replace(/\\/g, "/");
    this.video = myVal;
  }

  limpiar(){
    this.statusImagen = false;
    this.statusVideo = false;
    this.mensaje = null;
    this.imagen = null;
    this.video = null;
  }
}
