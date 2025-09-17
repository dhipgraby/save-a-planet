import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BalancesService {
    constructor(private readonly prisma: PrismaService) { }

    async getBalance(userId: number) {
        const balance = await this.prisma.balances.findUnique({ where: { userId } });
        if (!balance) {
            throw new HttpException('User balance profile not found', HttpStatus.NOT_FOUND);
        }
        return balance;
    }

    async getUserBalance(userId: number) {
        const balance = await this.prisma.balances.findUnique({ where: { userId }, select: { coins: true } });
        if (!balance) return {
            daiColateral: 0,
            coins: 0,
            isCreated: false
        }

        balance["isCreated"] = true
        return balance;
    }

    async increaseBalance(userId: number, coins: number) {
        const balance = await this.getBalance(userId);
        const newCoinsBalance = Number(balance.coins) + Number(coins);

        await this.prisma.balances.update({
            where: { userId },
            data: {
                coins: newCoinsBalance,
                last_modified: new Date().toISOString(),
            },
        });
    }

    async decreaseBalance(userId: number, coinsAmount: number) {
        const balance = await this.getBalance(userId);
        const newBalance = Number(balance.coins) - Number(coinsAmount);

        if (newBalance < 0) {
            throw new HttpException('Insufficient balance', HttpStatus.BAD_REQUEST);
        }

        await this.prisma.balances.update({
            where: { userId },
            data: {
                coins: newBalance,
                last_modified: new Date().toISOString(),
            },
        });
    }


}
