declare module "cliui" {
  export interface CliUiOptions {
    width?: number;
    wrap?: boolean;
  }

  export interface CliUiColumn {
    align?: "center" | "right";
    border?: boolean;
    padding?: [number, number, number, number];
    text: string;
    width?: number;
  }

  export interface CliUiInstance {
    div(...columns: Array<CliUiColumn | string>): void;
    resetOutput(): void;
    span(...columns: Array<CliUiColumn | string>): void;
    toString(): string;
  }

  export default function cliui(options?: CliUiOptions): CliUiInstance;
}
