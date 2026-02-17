import { prisma } from "./prisma";

export const getUserSubscription = async (userId: string) => {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription) return null;

    const isValid =
        subscription.status === "active" ||
        subscription.status === "trialing" ||
        (subscription.status === "canceled" &&
            subscription.currentPeriodEnd &&
            subscription.currentPeriodEnd.getTime() > Date.now());

    return {
        ...subscription,
        isValid,
    };
};
