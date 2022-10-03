import { prisma, prismaErrors } from "@lib/integration/prismaConnector";
import { AccessLog, FormUser } from "@prisma/client";
import { JWT } from "next-auth";
import { LoggingAction } from "./auth";
import { Ability } from "./policyBuilder";
import { checkPrivelages } from "./privelages";
/**
 * Get all Users
 * @returns An array of all Users
 */
export const getUsers = async (ability: Ability) => {
  try {
    checkPrivelages(ability, [{ action: "view", subject: "User" }]);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        privelages: true,
      },
    });

    return users;
  } catch (e) {
    return prismaErrors(e, []);
  }
};

/**
 * Get a FormUser
 * @param userId FormUser Id
 * @returns FormUser Object
 */
export const getFormUser = async (userId: string): Promise<FormUser | null> => {
  try {
    return await prisma.formUser.findUnique({
      where: {
        id: userId,
      },
    });
  } catch (e) {
    return prismaErrors(e, null);
  }
};

/**
 * Get or Create a user if a record does not exist
 * @returns A User Object
 */
export const getOrCreateUser = async (userToken: JWT) => {
  try {
    if (!userToken.email) throw new Error("Email address does not exist on token");
    const user = await prisma.user.findUnique({
      where: {
        email: userToken.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        privelages: true,
      },
    });

    // If a user already exists return the record
    if (user !== null && user.privelages.length) return user;

    // User does not exist, create and return a record
    const { name, email, picture: image } = userToken;
    const basePrivelages = await prisma.privelage.findUnique({
      where: {
        nameEn: "base",
      },
      select: {
        id: true,
      },
    });

    if (basePrivelages === null) throw new Error("Base Privelages is not set in Database");

    if (!user) {
      return await prisma.user.create({
        data: {
          name,
          email,
          image,
          privelages: {
            connect: basePrivelages,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          privelages: true,
        },
      });
    } else {
      return await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          privelages: {
            connect: basePrivelages,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          privelages: true,
        },
      });
    }
  } catch (e) {
    return prismaErrors(e, null);
  }
};

/**
 * Retrieves the accessLog entry for the last login for a user
 * @param userId
 * @returns AccessLog object
 */
export const userLastLogin = async (userId: string): Promise<AccessLog | null> => {
  try {
    return await prisma.accessLog.findFirst({
      where: {
        userId: userId,
        action: LoggingAction.LOGIN,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  } catch (e) {
    return prismaErrors(e, null);
  }
};
