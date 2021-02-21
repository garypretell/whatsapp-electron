import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { ElectronService } from "../core/services";

const puppeteer = require('puppeteer-core')
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
       executablePath: "./node_modules/puppeteer/.local-chromium/win64-848005/chrome-win/chrome.exe",
       headless: false,
      });
    const [page] = await browser.pages();
    await page.goto("http://web.whatsapp.com");
    await page.waitForSelector("._1awRl", { timeout: 60000 });

    console.log("logged in");

    for (const contact of contactos) {
      const mensaje = "Mensaje de texto";
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

      const xpath_attach_box =
        '//*[@id="main"]/footer/div[1]/div[1]/div[2]/div/div/span';
      const [span_button] = await page.$x(xpath_attach_box);
      await span_button.click();

      const elementHandle = await page.$("input[type='file']");
      await elementHandle.uploadFile("D:/imagen.jpg");
      await elementHandle.press("Enter");

      await page.waitFor(3000);
      const xpath_enviar = '//*[@id="app"]/div/div/div[2]/div[2]/span/div/span/div/div/div[2]/span/div/div/span';
      const [enviar_button] = await page.$x(xpath_enviar);
      await enviar_button.click();
      await page.waitFor(7000);
      console.log("success send message to " + contact);
    }

    console.log("done");
    await page.waitFor(1000);
    browser.close();
  };

  iniciar(): any {
    this.start();
  }
}
