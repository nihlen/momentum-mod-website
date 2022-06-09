import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { UpdateUserDto, UserDto } from '../../@common/dto/user/user.dto';
import { UsersService } from '../users/users.service';
import { LoggedInUser } from '../../@common/decorators/logged-in-user.decorator';
import { UserGetQuery } from './queries/get.query.dto';
import { FollowStatusDto, UpdateFollowStatusDto } from '../../@common/dto/user/followers.dto';
import { ProfileDto } from '../../@common/dto/user/profile.dto';

@ApiBearerAuth()
@Controller('api/v1/user')
@ApiTags('User')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly usersService: UsersService) {}

    //#region Main User Endpoints

    @Get()
    @ApiOperation({ summary: 'Get local user, based on JWT' })
    public async GetUser(@LoggedInUser('id') userID: number, @Query() query?: UserGetQuery): Promise<UserDto> {
        return this.usersService.Get(userID, query.expand);
    }

    @Patch()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Update the local users's data" })
    @ApiBody({
        type: UpdateUserDto,
        description: 'Update user data transfer object',
        required: true
    })
    public async UpdateUser(@LoggedInUser('id') userID: number, @Body() updateDto: UpdateUserDto) {
        await this.usersService.Update(userID, updateDto);
    }

    //#endregion

    //#region Profile

    @Get('/profile')
    @ApiOperation({ summary: 'Get local user, based on JWT' })
    public async GetProfile(@LoggedInUser('id') userID: number): Promise<ProfileDto> {
        return this.usersService.GetProfile(userID);
    }

    //#endregion

    //#region Follows

    @Get('/follow/:userID')
    @ApiOperation({ summary: 'Returns the follow relationship between the local user and a target user' })
    @ApiParam({
        name: 'userID',
        type: Number,
        description: 'User ID of the user to check the follow status for',
        required: true
    })
    public GetFollowStatus(
        @LoggedInUser('id') localUserID: number,
        @Param('userID', ParseIntPipe) targetUserID: number
    ): Promise<FollowStatusDto> {
        return this.usersService.GetFollowStatus(localUserID, targetUserID);
    }

    @Post('/follow/:userID')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Follows the target user' })
    @ApiParam({
        name: 'userID',
        type: Number,
        description: 'User ID of the user to follow',
        required: true
    })
    public FollowUser(@LoggedInUser('id') localUserID: number, @Param('userID', ParseIntPipe) targetUserID: number) {
        return this.usersService.FollowUser(localUserID, targetUserID);
    }

    @Patch('/follow/:userID')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Follows the target user' })
    @ApiParam({
        name: 'userID',
        type: Number,
        description: 'User ID of user to modify the follow for',
        required: true
    })
    @ApiBody({
        type: UpdateFollowStatusDto,
        description: 'Updates what activities the player wants to be notified of from the given user',
        required: true
    })
    public UpdateFollow(
        @LoggedInUser('id') localUserID: number,
        @Param('userID', ParseIntPipe) targetUserID: number,
        @Body() updateDto: UpdateFollowStatusDto
    ) {
        return this.usersService.UpdateFollow(localUserID, targetUserID, updateDto);
    }

    @Delete('/follow/:userID')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unfollows the target user' })
    @ApiParam({
        name: 'userID',
        type: Number,
        description: 'User ID of the user to unfollow',
        required: true
    })
    @ApiBody({
        type: UpdateFollowStatusDto,
        description: 'Updates what activities the player wants to be notified of from the given user',
        required: true
    })
    public UnfollowUser(@LoggedInUser('id') localUserID: number, @Param('userID', ParseIntPipe) targetUserID: number) {
        return this.usersService.UnfollowUser(localUserID, targetUserID);
    }

    //#endregion
}
