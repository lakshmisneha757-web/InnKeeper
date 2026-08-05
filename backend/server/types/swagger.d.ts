declare module "swagger-jsdoc" {
  const swaggerJSDoc: (options: any) => any;
  export default swaggerJSDoc;
}

declare module "swagger-ui-express" {
  const swaggerUi: {
    serve: any;
    setup: (spec: any) => any;
  };
  export default swaggerUi;
}
