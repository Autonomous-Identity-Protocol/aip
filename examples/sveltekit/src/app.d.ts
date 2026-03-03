import type { AipIdentity } from "@aip/core";

declare global {
  namespace App {
    interface Locals {
      aipIdentity: AipIdentity | null;
    }
  }
}

export {};
