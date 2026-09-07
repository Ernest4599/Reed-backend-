export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Reed Backend",
    version: "1.0.0",
    description: "Signup and login for the Reed social app",
  },
  servers: [{ url: "https://reed-backend-lcjv.onrender.com" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Service is up" } },
      },
    },
    "/auth/signup": {
      post: {
        summary: "Create a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["first_name", "surname", "contact", "contact_type", "date_of_birth", "gender", "password"],
                properties: {
                  first_name: { type: "string" },
                  middle_name: { type: "string", nullable: true },
                  surname: { type: "string" },
                  contact: { type: "string" },
                  contact_type: { type: "string", enum: ["phone", "email"] },
                  date_of_birth: { type: "string", format: "date" },
                  gender: { type: "string", enum: ["male", "female"] },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Account created, token returned" },
          "400": { description: "Validation error" },
          "409": { description: "Account already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in with contact + password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contact", "password"],
                properties: {
                  contact: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Logged in, token returned" },
          "401": { description: "Incorrect credentials" },
          "403": { description: "Account not verified" },
        },
      },
    },
  },
};
