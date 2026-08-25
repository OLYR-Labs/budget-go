import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  logger: {
    level: "debug",
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
        returned: true,
      },

      phone: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "CUSTOMER",
      adminRoles: ["ADMIN"],
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});