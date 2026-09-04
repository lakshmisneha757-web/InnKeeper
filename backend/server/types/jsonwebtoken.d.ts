declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
    [key: string]: any;
  }

  export interface VerifyOptions {
    algorithms?: string[];
    [key: string]: any;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: any,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: any,
    options?: VerifyOptions
  ): any;

  export function decode(token: string, options?: any): any;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
    decode: typeof decode;
  };

  export default jwt;
}
