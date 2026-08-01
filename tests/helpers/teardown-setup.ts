import type { FullConfig } from "@playwright/test";

const globalTeardown = async (config: FullConfig) => {

    /* Executed after all workers complete. Good place for cleanup tasks */
     console.log(`[INFO]: Starting the global teardown process ...`);

    console.log(`[INFO]: Completed the global teardown process ...`);
}
export default globalTeardown;