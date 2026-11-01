import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { gameRewardService, DAILY_LOGIN_SCHEDULE } from './gameRewardService';

describe('GameRewardService Economy and Gamification Suite', () => {
  beforeEach(() => {
    gameRewardService.resetForTesting();
  });

  it('1. Initializes default coin balance and tracks additions/spending', () => {
    const initial = gameRewardService.getCoins();
    assert.strictEqual(typeof initial, 'number');
    assert.strictEqual(initial, 500);

    const updated = gameRewardService.addCoins(250, 'Test Reward');
    assert.strictEqual(updated, 750);

    const spendSuccess = gameRewardService.spendCoins(100);
    assert.strictEqual(spendSuccess, true);
    assert.strictEqual(gameRewardService.getCoins(), 650);

    const spendFail = gameRewardService.spendCoins(999999);
    assert.strictEqual(spendFail, false);
  });

  it('2. Daily login claims correctly and grants today rewards and interesting facts', () => {
    const claimRes = gameRewardService.claimDailyReward();
    assert.ok(claimRes.dayIndex >= 0 && claimRes.dayIndex < DAILY_LOGIN_SCHEDULE.length);
    assert.ok(claimRes.reward.coins > 0);
    assert.ok(claimRes.reward.interestingThing.topic.length > 0);
    assert.ok(claimRes.giftAwarded.id.length > 0);

    // Verify claimed status
    assert.strictEqual(gameRewardService.hasClaimedDailyToday(), true);

    // Verify state
    const state = gameRewardService.getDailyLoginState();
    assert.strictEqual(state.streakCount, 1);
    assert.strictEqual(state.lastClaimDate, gameRewardService.getTodayDateStr());
  });

  it('3. Spinner bounty lifecycle: set bounty, claim reward upon solve', () => {
    const mockBounty = {
      id: 'bounty_test_1',
      problem: {
        contestId: 4,
        index: 'A',
        name: 'Watermelon',
        rating: 800,
        tags: ['brute force', 'math'],
      },
      rewardCoins: 350,
      giftChest: {
        title: 'Watermelon Slicer Chest',
        rarity: 'rare' as const,
        icon: '🍉',
      },
      spunAt: new Date().toISOString(),
      multiplier: 1.5,
      isSolved: false,
      isClaimed: false,
    };

    gameRewardService.setSpunBounty(mockBounty);
    const active = gameRewardService.getActiveSpunBounty();
    assert.strictEqual(active?.id, 'bounty_test_1');
    assert.strictEqual(active?.rewardCoins, 350);

    const beforeCoins = gameRewardService.getCoins();
    const claimRes = gameRewardService.claimSpunBountyReward('bounty_test_1');
    assert.ok(claimRes);
    assert.strictEqual(claimRes?.coinsAwarded, 350);
    assert.strictEqual(gameRewardService.getCoins(), beforeCoins + 350);

    // Cannot claim twice
    const doubleClaim = gameRewardService.claimSpunBountyReward('bounty_test_1');
    assert.strictEqual(doubleClaim, null);
  });

  it('4. Records game progress, calculates stars, and grants coins', () => {
    const beforeCoins = gameRewardService.getCoins();
    const result = gameRewardService.recordGameLevelComplete('pattern_matrix', 'lvl_1', 3, 1000);

    assert.strictEqual(result.isFirstClear, true);
    assert.strictEqual(result.newTotalStars, 3);
    assert.ok(result.earnedCoins > 0);
    assert.strictEqual(gameRewardService.getCoins(), beforeCoins + result.earnedCoins);

    const progress = gameRewardService.getGamesProgress();
    assert.strictEqual(progress.pattern_matrix.starsTotal, 3);
    assert.strictEqual(progress.pattern_matrix.completedLevels['lvl_1'].stars, 3);
  });

  it('5. Daily code fortune returns deterministic prophecy and awards coins when cracked', () => {
    const fortune = gameRewardService.getDailyFortune();
    assert.ok(fortune.luckyConcept.length > 0);
    assert.ok(fortune.powerBuff.title.length > 0);
    assert.strictEqual(fortune.cracked, false);
    assert.strictEqual(gameRewardService.hasCrackedDailyFortuneToday(), false);

    const initialCoins = gameRewardService.getCoins();
    const result = gameRewardService.crackDailyFortune();
    assert.strictEqual(result.fortune.cracked, true);
    assert.strictEqual(result.coinsAwarded, 50);
    assert.strictEqual(result.xpAwarded, 25);
    assert.strictEqual(gameRewardService.getCoins(), initialCoins + 50);
    assert.strictEqual(gameRewardService.hasCrackedDailyFortuneToday(), true);

    // Cracking again on same day should not double-award
    const secondCrack = gameRewardService.crackDailyFortune();
    assert.strictEqual(secondCrack.coinsAwarded, 0);
  });

  it('6. Mascot companion petting grants cheer and daily affection rewards', () => {
    assert.strictEqual(gameRewardService.hasPetMascotToday(), false);

    const initialCoins = gameRewardService.getCoins();
    const res1 = gameRewardService.petMascot();
    assert.strictEqual(res1.isFirstPetToday, true);
    assert.ok(res1.coinsAwarded > 0);
    assert.ok(res1.message.length > 0);
    assert.strictEqual(gameRewardService.getCoins(), initialCoins + res1.coinsAwarded);
    assert.strictEqual(gameRewardService.hasPetMascotToday(), true);

    // Subsequent pet on same day gives love message and XP without duplicate coin abuse
    const res2 = gameRewardService.petMascot();
    assert.strictEqual(res2.isFirstPetToday, false);
    assert.strictEqual(res2.coinsAwarded, 0);
  });
});
