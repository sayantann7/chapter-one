import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealthStatus(): { status: string; message: string; timestamp: string } {
    return {
      status: "ok",
      message: "Chapter One API is operational",
      timestamp: new Date().toISOString(),
    };
  }
}
