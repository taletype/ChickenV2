export const Provider = {
  create() {
    throw new Error("optional_accounts_connector_disabled");
  }
};

export function dialog() {
  throw new Error("optional_accounts_connector_disabled");
}

export function webAuthn() {
  throw new Error("optional_accounts_connector_disabled");
}

export function dangerous_secp256k1() {
  throw new Error("optional_accounts_connector_disabled");
}
