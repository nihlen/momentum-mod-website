#!/usr/bin/env node

import { Bitflags } from '@momentum/bitflags';

/**
 * Ugly script for seeding the DB with faker.js data, useful for frontend developers.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Random } from '@momentum/random';
import {
  ActivityType,
  Ban,
  MapCreditType,
  MapStatus,
  MapType,
  ReportCategory,
  ReportType,
  Role
} from '@momentum/constants';

const prisma = new PrismaClient();

// Seed Configuration
const NUM_OF_USERS_TO_CREATE = 50,
  NUM_OF_USERS_TO_MAKE_MAPPERS = 5,
  NUM_OF_MAPPERS_TO_UPLOAD_MAPS = 10,
  MIN_NUM_OF_MAPS_TO_UPLOAD_EACH = 1,
  MAX_NUM_OF_MAPS_TO_UPLOAD_EACH = 4,
  MIN_NUM_OF_TRACKS_PER_MAP = 1,
  MAX_NUM_OF_TRACKS_PER_MAP = 20,
  MIN_NUM_OF_ZONES_PER_TRACK = 1,
  MAX_NUM_OF_ZONES_PER_TRACK = 10,
  MIN_NUM_OF_MAP_IMAGES_PER_MAP = 2,
  MAX_NUM_OF_MAP_IMAGES_PER_MAP = 5,
  MIN_NUM_OF_CREDITS_PER_MAP = 1,
  MAX_NUM_OF_CREDITS_PER_MAP = 10;

// Arrays below are used to prevent many queries to get currently existing user IDs and map IDs
let existingUserIDs: number[] = [],
  existingMapIDs: number[] = [];

async function main() {
  console.log('Creating users');
  await createUsers();

  console.log('Making random users mappers');
  await makeRandomUsersMappers();

  console.log('Uploading maps for mappers');
  await uploadMaps();

  console.log('Creating user to user interactions');
  await userToUserInteractions();

  console.log('Creating user to map interactions');
  await userToMapInteractions();

  console.log('Done!');
}

async function createRandomUser() {
  return prisma.user.create({
    data: {
      steamID: Random.int(1000000000, 99999999999),
      alias: faker.name.fullName(),
      avatar: 'ac7305567f93a4c9eec4d857df993191c61fb240_full.jpg',
      country: faker.address.countryCode(),
      ...Random.createdUpdatedDates(),
      roles: Bitflags.join(
        Random.weightedBool(0.1) ? Role.VERIFIED : 0,
        Random.weightedBool(0.1) ? Role.PLACEHOLDER : 0,
        Random.weightedBool(0.1) ? Role.ADMIN : 0,
        Random.weightedBool(0.1) ? Role.MODERATOR : 0
      ),
      bans: Bitflags.join(
        Random.weightedBool(0.1) ? Ban.BIO : 0,
        Random.weightedBool(0.1) ? Ban.AVATAR : 0,
        Random.weightedBool(0.1) ? Ban.LEADERBOARDS : 0,
        Random.weightedBool(0.1) ? Ban.ALIAS : 0
      )
    }
  });
}

async function createRandomUserProfile(userID) {
  return prisma.profile.create({
    data: {
      userID: userID,
      bio: faker.lorem.paragraphs().slice(0, 999),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomUserStats(userID) {
  return prisma.userStats.create({
    data: {
      userID: userID,
      totalJumps: Random.int(10000),
      totalStrafes: Random.int(10000),
      level: Random.int(0, 1000),
      cosXP: Random.int(10000),
      mapsCompleted: Random.int(10000),
      runsSubmitted: Random.int(10000),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMap(submitterID) {
  return prisma.map.create({
    data: {
      name: faker.lorem.word(),
      type: Random.enumValue(MapType),
      status: Random.enumValue(MapStatus),
      fileKey: faker.animal.cat(),
      hash: faker.random.alphaNumeric(),
      submitterID: submitterID,
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapInfo(mapID) {
  return prisma.mapInfo.create({
    data: {
      mapID: mapID,
      description: faker.lorem.paragraphs().slice(0, 999),
      numTracks: Random.int(1, 100),
      creationDate: Random.pastDateInYears(),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapImage(mapID) {
  return prisma.mapImage.create({
    data: {
      mapID: mapID,
      ...Random.createdUpdatedDates()
    }
  });
}

const createRandomMapCredit = async (mapID, userID) =>
  await prisma.mapCredit.create({
    data: {
      type: Random.enumValue(MapCreditType),
      mapID: mapID,
      userID: userID,
      ...Random.createdUpdatedDates()
    }
  });

async function createRandomBaseStats() {
  return prisma.baseStats.create({
    data: {
      jumps: Random.int(10000),
      strafes: Random.int(10000),
      avgStrafeSync: Random.float(1, 120, 4),
      avgStrafeSync2: Random.float(1, 120, 4),
      enterTime: Random.float(1, 5, 4),
      totalTime: Random.float(30, 99999999, 2),
      velAvg3D: Random.float(1, 9001, 2),
      velAvg2D: Random.float(1, 9001, 2),
      velMax3D: Random.float(1, 9001, 2),
      velMax2D: Random.float(1, 9001, 2),
      velEnter3D: Random.float(1, 9001, 2),
      velEnter2D: Random.float(1, 9001, 2),
      velExit3D: Random.float(1, 9001, 2),
      velExit2D: Random.float(1, 9001, 2),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapStats(mapID, baseStatsID) {
  return prisma.mapStats.create({
    data: {
      mapID: mapID,
      baseStatsID: baseStatsID,
      reviews: Random.int(10000),
      downloads: Random.int(10000),
      subscriptions: Random.int(10000),
      plays: Random.int(10000),
      favorites: Random.int(10000),
      completions: Random.int(10000),
      uniqueCompletions: Random.int(10000),
      timePlayed: Random.int(10000)
    }
  });
}

async function createRandomMapTrack(mapID) {
  return prisma.mapTrack.create({
    data: {
      mapID: mapID,
      trackNum: Random.int(0, 127),
      numZones: Random.int(5, 127),
      isLinear: faker.datatype.boolean(),
      difficulty: Random.int(1, 8),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapTrackStats(mapTrackID, baseStatsID) {
  await prisma.mapTrackStats.create({
    data: {
      trackID: mapTrackID,
      baseStatsID: baseStatsID,
      completions: Random.int(10000),
      uniqueCompletions: Random.int(10000),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapZone(mapTrackID) {
  return prisma.mapZone.create({
    data: {
      trackID: mapTrackID,
      zoneNum: Random.int(0, 127)
    }
  });
}

async function createRandomMapZoneStats(mapZoneID, baseStatsID) {
  return prisma.mapZoneStats.create({
    data: {
      zoneID: mapZoneID,
      baseStatsID: baseStatsID,
      completions: Random.int(10000),
      uniqueCompletions: Random.int(10000)
    }
  });
}

async function createRandomRun(mapID, userID, baseStatsID) {
  const ticks = Random.int(10000);
  const tickRate = Random.int(24, 1000);

  return prisma.run.create({
    data: {
      mapID: mapID,
      userID: userID,
      overallStatsID: baseStatsID,
      trackNum: Random.int(0, 127),
      zoneNum: Random.int(0, 127),
      ticks: ticks,
      tickRate: tickRate,
      flags: 0,
      file: faker.image.cats(),
      hash: faker.random.alphaNumeric(),
      time: ticks * tickRate,
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomRunZoneStats(runID, baseStatsID) {
  return prisma.runZoneStats.create({
    data: {
      runID: runID,
      baseStatsID: baseStatsID,
      zoneNum: Random.int(0, 127),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapRank(mapID, userID, runID) {
  return prisma.rank.create({
    data: {
      mapID: mapID,
      userID: userID,
      runID: runID,
      gameType: Random.int(0, 127),
      flags: 0,
      rank: Random.int(10000),
      rankXP: Random.int(10000),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomUserFollow(followeeID, followedID) {
  return prisma.follow.create({
    data: {
      followeeID: followeeID,
      followedID: followedID,
      notifyOn: Random.int(0, 127),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomMapReview(userID, mapID) {
  return prisma.mapReview.create({
    data: {
      reviewerID: userID,
      mapID: mapID,
      text: faker.lorem.sentences(),
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomActivity(userID, type, data) {
  return prisma.activity.create({
    data: {
      userID: userID,
      type: type,
      data: data,
      ...Random.createdUpdatedDates()
    }
  });
}

async function createRandomReport(reportType, data, submitterID, resolverID) {
  return prisma.report.create({
    data: {
      type: reportType,
      data: BigInt(data),
      category: Random.enumValue(ReportCategory),
      message: faker.lorem.paragraph(),
      resolved: faker.datatype.boolean(),
      resolutionMessage: faker.lorem.sentence(),
      submitterID: submitterID,
      resolverID: resolverID
    }
  });
}

async function createUsers() {
  existingUserIDs = await Promise.all(
    Array.from({ length: NUM_OF_USERS_TO_CREATE }, async () => {
      const newUser = await createRandomUser();
      await createRandomUserProfile(newUser.id);
      await createRandomUserStats(newUser.id);
      return newUser.id;
    })
  );
}

async function makeRandomUsersMappers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      roles: true
    },
    take: NUM_OF_USERS_TO_MAKE_MAPPERS
  });

  return Promise.all(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: { roles: Role.MAPPER }
      })
    )
  );
}

async function uploadMaps() {
  const mappers = await prisma.user.findMany({
    select: { id: true },
    where: { roles: Role.MAPPER },
    take: NUM_OF_MAPPERS_TO_UPLOAD_MAPS
  });

  existingMapIDs = await Promise.all(
    mappers.flatMap((mapper) =>
      Array.from(
        {
          length: Random.int(
            MIN_NUM_OF_MAPS_TO_UPLOAD_EACH,
            MAX_NUM_OF_MAPS_TO_UPLOAD_EACH
          )
        },
        async () => {
          const map = await createRandomMap(mapper.id);
          await createRandomMapInfo(map.id);

          await Promise.all(
            Array.from(
              {
                length: Random.int(
                  MIN_NUM_OF_TRACKS_PER_MAP,
                  MAX_NUM_OF_TRACKS_PER_MAP
                )
              },
              async () => {
                const track = await createRandomMapTrack(map.id);

                const baseStats = await createRandomBaseStats();
                await createRandomMapTrackStats(track.id, baseStats.id);

                await Promise.all(
                  Array.from(
                    {
                      length: Random.int(
                        MIN_NUM_OF_ZONES_PER_TRACK,
                        MAX_NUM_OF_ZONES_PER_TRACK
                      )
                    },
                    async () => {
                      const zone = await createRandomMapZone(track.id);
                      const zoneBaseStats = await createRandomBaseStats();
                      await createRandomMapZoneStats(zone.id, zoneBaseStats.id);
                    }
                  )
                );
              }
            )
          );

          const images = await Promise.all(
            Array.from(
              {
                length: Random.int(
                  MIN_NUM_OF_MAP_IMAGES_PER_MAP,
                  MAX_NUM_OF_MAP_IMAGES_PER_MAP
                )
              },
              () => createRandomMapImage(map.id)
            )
          );

          await prisma.map.update({
            where: { id: map.id },
            data: { thumbnailID: images[0].id }
          });

          await Promise.all(
            Array.from(
              {
                length: Random.int(
                  MIN_NUM_OF_CREDITS_PER_MAP,
                  MAX_NUM_OF_CREDITS_PER_MAP
                )
              },
              () =>
                createRandomMapCredit(map.id, Random.element(existingUserIDs))
            )
          );

          const baseStats = await createRandomBaseStats();
          await createRandomMapStats(map.id, baseStats.id);

          await createRandomActivity(
            map.submitterID,
            ActivityType.MAP_UPLOADED,
            map.id
          );
          await createRandomActivity(
            map.submitterID,
            ActivityType.MAP_APPROVED,
            map.id
          );

          return map.id;
        }
      )
    )
  );
}

async function userToUserInteractions() {
  await Promise.all(
    existingUserIDs.flatMap((id1) =>
      existingUserIDs.map(async (id2) => {
        if (id1 == id2) return;
        if (Random.weightedBool(0.2)) await createRandomUserFollow(id1, id2);

        if (Random.weightedBool(0.5))
          await createRandomReport(
            ReportType.USER_PROFILE_REPORT,
            id1,
            id2,
            Random.element(
              existingUserIDs.filter((u) => u !== id1 && u !== id2)
            )
          );
      })
    )
  );
}

async function userToMapInteractions() {
  await Promise.all(
    existingUserIDs.flatMap((userID) =>
      existingMapIDs.map(async (mapID) => {
        // Runs
        if (Random.weightedBool(0.25)) {
          const baseStats = await createRandomBaseStats();
          const run = await createRandomRun(mapID, userID, baseStats.id);

          await Promise.all(
            Array.from({ length: Random.int(10) }, async () => {
              const zoneBaseStats = await createRandomBaseStats();
              return createRandomRunZoneStats(run.id, zoneBaseStats.id);
            })
          );

          await createRandomMapRank(mapID, userID, run.id);
        }

        // Favourites
        if (Random.weightedBool(0.05))
          await prisma.mapFavorite.create({
            data: {
              userID: userID,
              mapID: mapID,
              ...Random.createdUpdatedDates()
            }
          });

        // Reviews
        if (Random.weightedBool(0.05))
          await createRandomMapReview(userID, mapID);

        // Map Reports
        if (Random.weightedBool(0.05))
          await createRandomReport(
            ReportType.MAP_REPORT,
            mapID,
            userID,
            Random.element(existingUserIDs)
          );
      })
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
