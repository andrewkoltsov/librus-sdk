import { emitDeprecationWarningOnce } from "../deprecationWarnings.js";

import {
  GatewayApi20AuthClient,
  type GatewayApi20AuthClientOptions,
} from "./GatewayApi20AuthClient.js";

/** @deprecated Use GatewayApi20AuthClient instead. */
export class DirectSynergiaAuthClient extends GatewayApi20AuthClient {
  constructor(options: GatewayApi20AuthClientOptions = {}) {
    emitDeprecationWarningOnce(
      "LIBRUS_DIRECT_SYNERGIA_AUTH_CLIENT_CLASS_DEPRECATED",
      "DirectSynergiaAuthClient is deprecated; use GatewayApi20AuthClient instead.",
    );

    super(options);
  }
}

/** @deprecated Use GatewayApi20AuthClientOptions instead. */
export type DirectSynergiaAuthClientOptions = GatewayApi20AuthClientOptions;
