module.exports = {
  apps: [
    {
      name: "scheduler",
      script: "./scripts/scheduler.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      env: {
        BSNL_EKEY: "b28272183c64fcb45b11d9098a7dd97df51f89bc1bae9448e4126258fd9446d1"
      }
    }
  ]
};
