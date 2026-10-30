import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRatingForecast } from './forecast';

test('calculateRatingForecast generates trajectory points up to Day 180', () => {
  const forecast = calculateRatingForecast(1, 0, undefined, 1600, 180);
  assert.equal(forecast.points.length, 8);
  assert.equal(forecast.points[0].day, 1);
  assert.equal(forecast.points[forecast.points.length - 1].day, 180);
  assert.ok(forecast.projectedFinalRating >= 800);
});

test('calculateRatingForecast adapts to higher solving velocity', () => {
  const slowForecast = calculateRatingForecast(30, 5, 900, 1600, 180);
  const fastForecast = calculateRatingForecast(30, 40, 1100, 1600, 180);

  assert.ok(fastForecast.currentVelocityProblemsPerWeek > slowForecast.currentVelocityProblemsPerWeek);
  assert.ok(fastForecast.projectedFinalRating > slowForecast.projectedFinalRating);
});

test('calculateRatingForecast includes uncertainty boundary corridor for future points', () => {
  const forecast = calculateRatingForecast(15, 8, 850, 1600, 180);
  const futurePoint = forecast.points.find((p) => p.day === 180);
  assert.ok(futurePoint);
  assert.ok(futurePoint.lowerBound !== undefined);
  assert.ok(futurePoint.upperBound !== undefined);
  assert.ok((futurePoint.upperBound || 0) > (futurePoint.lowerBound || 0));
});
