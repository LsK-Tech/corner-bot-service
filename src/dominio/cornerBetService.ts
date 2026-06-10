import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";

import { LoggerService } from "../infra-log/loggerService";

puppeteer.use(StealthPlugin());

export type GameCompactData = {
  screenshotPath: string;
  data?: unknown;
  exception?: Error;
};

function getLaunchOptions() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  return {
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };
}

export class CornerBetService {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService("CornerBetService");
  }

  async getGameCompactData(): Promise<GameCompactData> {
    this.logger.log("Iniciando a execução do getGameCompactData...");
    const browser = await puppeteer.launch(getLaunchOptions());
    const page = await browser.newPage();
    const screenshotPath = path.resolve("/tmp", "corner_bet_screenshot.png");

    try {
      this.logger.log("Definindo o tamanho da viewport...");
      await page.setViewport({ width: 1920, height: 1080 });

      this.logger.log("Verificando login...");
      const isLoggedIn = await this._login(page, screenshotPath);

      if (isLoggedIn) {
        this.logger.log("Login bem-sucedido!");
      } else {
        this.logger.error("Falha ao realizar login.");
        throw new Error("Falha ao realizar login.");
      }

      this.logger.log("Acessando a página de dados do jogo...");
      const response = await page.goto(
        "https://cornerprobet.com/actions/games/getCompact.php",
        { waitUntil: "networkidle2" },
      );

      if (!response) {
        throw new Error("Resposta vazia ao acessar getCompact.php");
      }

      this.logger.log("Obtendo conteúdo JSON...");
      const jsonContent = await response.json();

      this.logger.log("Conteúdo obtido com sucesso!");
      return { screenshotPath, data: jsonContent };
    } catch (error) {
      this.logger.error("Erro durante a execução:", error as Error);
      await page.screenshot({ path: screenshotPath });
      return { screenshotPath, exception: error as Error };
    } finally {
      this.logger.log("Fechando o navegador...");
      this.logger.log(`Path do screenshot: ${screenshotPath}`);
      await browser.close();
    }
  }

  async _login(page: Page, screenshotPath: string) {
    this.logger.log("Iniciando processo de login...");
    await page.goto("https://cornerprobet.com/pt/login", {
      waitUntil: "networkidle2",
    });

    this.logger.log("Aguardando 5 segundos para carregar a página de login...");
    await new Promise((r) => setTimeout(r, 5000));

    this.logger.log("Tirando screenshot da tela de login...");
    await page.screenshot({ path: screenshotPath });

    if (page.url().includes("/user")) {
      this.logger.log("Já está logado. Redirecionando...");
      return true;
    }

    const username = process.env.CORNER_BET_USERNAME;
    const password = process.env.CORNER_BET_PASSWORD;
    if (!username || !password) {
      this.logger.error(
        "CORNER_BET_USERNAME ou CORNER_BET_PASSWORD não definidos.",
      );
      return false;
    }

    try {
      this.logger.log("Preenchendo credenciais de login...");
      await page.type(
        "body > div.page-module__LBTDbq__container > section > div.page-module__kIwKeG__modal > div > div.page-module__kIwKeG__inputContainer > div:nth-child(1) > input",
        username,
      );
      await page.type(
        "body > div.page-module__LBTDbq__container > section > div.page-module__kIwKeG__modal > div > div.page-module__kIwKeG__inputContainer > div:nth-child(2) > input",
        password,
      );
      await page.click(
        "body > div.page-module__LBTDbq__container > section > div.page-module__kIwKeG__modal > div > div.page-module__kIwKeG__buttonContainer > button",
      );

      this.logger.log("Aguardando redirecionamento após clique...");
      await page
        .waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
        .catch(() => {});

      if (page.url().includes("/user")) {
        this.logger.log("Login realizado com sucesso!");
        return true;
      } else {
        this.logger.error("Login falhou após tentativa.");
        return false;
      }
    } catch (error) {
      this.logger.error("Erro durante o login:", error as Error);
      return false;
    }
  }
}
