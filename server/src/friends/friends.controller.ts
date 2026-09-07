import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(FirebaseAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * POST /api/friends/request/:targetUserId
   * Send friend request to another learner
   */
  @Post('request/:targetUserId')
  sendFriendRequest(
    @CurrentUser() user: User,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.friendsService.sendFriendRequest(user.id, targetUserId);
  }

  /**
   * POST /api/friends/accept/:friendshipId
   * Accept an incoming friend request
   */
  @Post('accept/:friendshipId')
  acceptFriendRequest(
    @CurrentUser() user: User,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendsService.acceptFriendRequest(user.id, friendshipId);
  }

  /**
   * POST /api/friends/reject/:friendshipId
   * Reject / decline incoming friend request
   */
  @Post('reject/:friendshipId')
  rejectFriendRequest(
    @CurrentUser() user: User,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendsService.rejectFriendRequest(user.id, friendshipId);
  }

  /**
   * GET /api/friends
   * Get all accepted speaking friends
   */
  @Get()
  getFriendsList(@CurrentUser() user: User) {
    return this.friendsService.getFriendsList(user.id);
  }

  /**
   * GET /api/friends/requests
   * Get all pending incoming friend requests
   */
  @Get('requests')
  getPendingRequests(@CurrentUser() user: User) {
    return this.friendsService.getPendingRequests(user.id);
  }

  /**
   * DELETE /api/friends/:friendshipId
   * Remove a friend
   */
  @Delete(':friendshipId')
  removeFriend(
    @CurrentUser() user: User,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendsService.removeFriend(user.id, friendshipId);
  }
}
