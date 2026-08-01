import type { FullConfig } from "@playwright/test";


const globalSetup = async (config: FullConfig) => {

    console.log(">> Global setup started...");

    if (process.env.ENV?.toUpperCase() == "LOCAL") {
        console.log(">> LOCAL environment detected (Playwright HTML/blob reports enabled)");
    }
}

export default globalSetup;