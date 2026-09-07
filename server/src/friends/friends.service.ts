import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. Send Friend Request
   * Target user ko friend request bhejta hai.
   */
  async sendFriendRequest(senderId: string, targetUserId: string) {
    if (senderId === targetUserId) {
      throw new BadRequestException('You cannot send a friend request to yourself.');
    }

    // Verify target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    // Check if target user has blocked sender or vice versa
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: senderId, blockedUserId: targetUserId },
          { userId: targetUserId, blockedUserId: senderId },
        ],
      },
    });
    if (isBlocked) {
      throw new BadRequestException('Cannot send friend request to this user.');
    }

    // Check existing friendship relation in either direction
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('You are already friends with this user.');
      }
      if (existing.status === 'PENDING') {
        if (existing.senderId === senderId) {
          throw new BadRequestException('Friend request already sent.');
        } else {
          // If the other person had already sent a request, auto-accept it!
          return this.acceptFriendRequest(senderId, existing.id);
        }
      }
      // If REJECTED, re-activate request
      return this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          senderId,
          receiverId: targetUserId,
          status: 'PENDING',
        },
      });
    }

    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId: targetUserId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            level: true,
          },
        },
      },
    });
  }

  /**
   * 2. Accept Friend Request
   */
  async acceptFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    // Only receiver can accept
    if (friendship.receiverId !== userId) {
      throw new BadRequestException('Only the recipient can accept this friend request.');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            level: true,
          },
        },
      },
    });
  }

  /**
   * 3. Reject / Cancel Friend Request
   */
  async rejectFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }

    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new BadRequestException('Unauthorized.');
    }

    return this.prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * 4. Get Accepted Friends List
   */
  async getFriendsList(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            level: true,
            totalMinutes: true,
            totalSessions: true,
            topTopic: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            level: true,
            totalMinutes: true,
            totalSessions: true,
            topTopic: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format so the friend is always the "other" person
    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        friendshipId: f.id,
        createdAt: f.createdAt,
        friend,
      };
    });
  }

  /**
   * 5. Get Pending Incoming Requests
   */
  async getPendingRequests(userId: string) {
    const incoming = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            level: true,
            address: true,
            education: true,
            hobbies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return incoming.map((req) => ({
      requestId: req.id,
      createdAt: req.createdAt,
      sender: req.sender,
    }));
  }

  /**
   * 6. Remove Friend
   */
  async removeFriend(userId: string, friendshipId: string) {
    return this.rejectFriendRequest(userId, friendshipId);
  }
}
