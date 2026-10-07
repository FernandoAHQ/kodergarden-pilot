import { Controller, Get, Res } from "@nestjs/common";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface FileResponse { sendFile(path: string): void }
const indexPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist/index.html");

@Controller()
export class AdminPageController {
  @Get("admin") admin(@Res() response: FileResponse): void { response.sendFile(indexPath); }
}
