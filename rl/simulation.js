// This is a fast, headless copy of the game environment.
//
// It intentionally has no canvas, DOM, audio, or animation loop. That
// allows 100 independent birds to be simulated synchronously while the
// browser only renders a lightweight visualization.
const SIMULATION_WIDTH = 360;
const SIMULATION_GROUND_Y = 540;
const SIMULATION_GRAVITY = 0.25;
const SIMULATION_FLAP_STRENGTH = -5.6;
const SIMULATION_BIRD_X = 75;
const SIMULATION_BIRD_RADIUS = 14;
const SIMULATION_PIPE_WIDTH = 54;
const SIMULATION_PIPE_GAP = 132;
const SIMULATION_PIPE_SPEED = 2.1;
const SIMULATION_PIPE_INTERVAL = 105;
const SIMULATION_MAX_TOP =
  SIMULATION_GROUND_Y - SIMULATION_PIPE_GAP - 70;

function createPipeSequence(length = 100) {
  // All birds in one generation receive the same course. This makes their
  // scores comparable: a bird should win because of its policy, not luck.
  // The live trainer creates a fresh sequence for the next generation.
  const sequence = [];

  for (let i = 0; i < length; i++) {
    const minTop = 60;
    const top = Math.floor(
      Math.random() * (SIMULATION_MAX_TOP - minTop + 1)
    ) + minTop;
    sequence.push(top);
  }

  return sequence;
}

function createHeadlessSimulation(pipeSequence) {
  // This object is the complete Markov state for one episode. Keeping it
  // self-contained is what allows many simulations to run in parallel.
  const simulation = {
    bird: {
      x: SIMULATION_BIRD_X,
      y: 280,
      radius: SIMULATION_BIRD_RADIUS,
      velocity: SIMULATION_FLAP_STRENGTH
    },
    pipes: [],
    pipeSequence: [...pipeSequence],
    nextPipeIndex: 0,
    score: 0,
    frames: 0,
    done: false,
    totalReward: 0,
    // This is only a tie-breaker when two birds pass the same number of
    // pipes. It is not part of the reward used by the policy.
    bestGapDistance: Infinity,
    rewardedPipe: null,
    nearRewardGiven: false
  };

  spawnHeadlessPipe(simulation);
  return simulation;
}

function spawnHeadlessPipe(simulation) {
  // The sequence stores pipe heights; movement and collision state live
  // on the pipe object created here.
  const top = simulation.pipeSequence[
    simulation.nextPipeIndex % simulation.pipeSequence.length
  ];

  simulation.pipes.push({
    id: simulation.nextPipeIndex,
    x: SIMULATION_WIDTH + 10,
    top,
    bottom: SIMULATION_GROUND_Y - (top + SIMULATION_PIPE_GAP),
    passed: false
  });

  simulation.nextPipeIndex++;
}

function getNextHeadlessPipe(simulation) {
  // The first pipe whose trailing edge has not passed the bird is the
  // relevant pipe for the observation.
  return simulation.pipes.find(
    pipe => pipe.x + SIMULATION_PIPE_WIDTH >= simulation.bird.x
  );
}

function getHeadlessObservation(simulation) {
  const nextPipe = getNextHeadlessPipe(simulation);

  if (!nextPipe) {
    return null;
  }

  // These features are the state representation supplied to the genome.
  const gapCenter = nextPipe.top + SIMULATION_PIPE_GAP / 2;
  const horizontalDistance = nextPipe.x - simulation.bird.x;
  const verticalDistance = gapCenter - simulation.bird.y;

  return {
    birdY: simulation.bird.y,
    birdVelocity: simulation.bird.velocity,
    distanceToPipe: horizontalDistance,
    verticalDistanceToGapCenter: verticalDistance,
    distanceToGapCenter: Math.hypot(
      horizontalDistance,
      verticalDistance
    )
  };
}

function calculateHeadlessReward(
  simulation,
  beforeObservation,
  afterObservation,
  beforePipe,
  afterPipe,
  previousScore
) {
  let reward = 0;

  // The environment reward is event-based, not a reward every frame.
  if (simulation.score > previousScore) {
    reward += 3;
  }

  if (simulation.done) {
    reward -= 2;
  }

  if (afterPipe !== simulation.rewardedPipe) {
    // Reset the one-time near-gap reward when the agent reaches a new pipe.
    simulation.rewardedPipe = afterPipe;
    simulation.nearRewardGiven = false;
  }

  if (
    beforePipe &&
    afterPipe &&
    beforePipe === afterPipe &&
    beforeObservation &&
    afterObservation
  ) {
    if (
      !simulation.nearRewardGiven &&
      beforeObservation.distanceToGapCenter > 50 &&
      afterObservation.distanceToGapCenter <= 50
    ) {
      reward += 2;
      simulation.nearRewardGiven = true;
    }
  }

  return reward;
}

function stepHeadlessSimulation(simulation, action) {
  // A completed episode is terminal. Do not advance its physics again.
  if (simulation.done) {
    return {
      observation: getHeadlessObservation(simulation),
      reward: 0,
      done: true
    };
  }

  if (action !== 0 && action !== 1) {
    throw new Error('Action must be 0 or 1');
  }

  const beforeObservation = getHeadlessObservation(simulation);
  const beforePipe = getNextHeadlessPipe(simulation);
  const previousScore = simulation.score;

  if (action === 1) {
    // Flapping changes vertical velocity immediately; gravity is then
    // applied below, matching the order used by the game.
    simulation.bird.velocity = SIMULATION_FLAP_STRENGTH;
  }

  // Advance one environment timestep.
  simulation.frames++;
  simulation.bird.velocity += SIMULATION_GRAVITY;
  simulation.bird.y += simulation.bird.velocity;

  if (simulation.bird.y - simulation.bird.radius <= 0) {
    simulation.bird.y = simulation.bird.radius;
    simulation.bird.velocity = 0;
  }

  if (
    simulation.bird.y + simulation.bird.radius >=
    SIMULATION_GROUND_Y
  ) {
    // Hitting the ground ends the episode.
    simulation.bird.y = SIMULATION_GROUND_Y - simulation.bird.radius;
    simulation.done = true;
  }

  if (!simulation.done) {
    if (simulation.frames % SIMULATION_PIPE_INTERVAL === 0) {
      // Pipes are added at a fixed interval while existing pipes move left.
      spawnHeadlessPipe(simulation);
    }

    for (const pipe of simulation.pipes) {
      pipe.x -= SIMULATION_PIPE_SPEED;

      if (
        !pipe.passed &&
        pipe.x + SIMULATION_PIPE_WIDTH < simulation.bird.x
      ) {
        // Passing a pipe increments the task score. The reward function
        // turns this score change into the +3 learning reward.
        pipe.passed = true;
        simulation.score++;
      }

      const birdBox = {
        left: simulation.bird.x - simulation.bird.radius + 3,
        right: simulation.bird.x + simulation.bird.radius - 3,
        top: simulation.bird.y - simulation.bird.radius + 3,
        bottom: simulation.bird.y + simulation.bird.radius - 3
      };

      const overlapsPipe =
        birdBox.right > pipe.x &&
        birdBox.left < pipe.x + SIMULATION_PIPE_WIDTH;
      const hitsTopPipe = overlapsPipe && birdBox.top < pipe.top;
      const bottomPipeY = SIMULATION_GROUND_Y - pipe.bottom;
      const hitsBottomPipe =
        overlapsPipe && birdBox.bottom > bottomPipeY;

      if (hitsTopPipe || hitsBottomPipe) {
        // Collision with either part of a pipe ends this episode.
        simulation.done = true;
        break;
      }
    }
  }

  // Track a geometric tie-breaker before creating the next observation.
  updateBestGapDistance(simulation);

  const afterObservation = getHeadlessObservation(simulation);
  const afterPipe = getNextHeadlessPipe(simulation);
  // Calculate reward from the transition, then accumulate it for reporting.
  const reward = calculateHeadlessReward(
    simulation,
    beforeObservation,
    afterObservation,
    beforePipe,
    afterPipe,
    previousScore
  );

  simulation.totalReward += reward;

  return {
    observation: afterObservation,
    reward,
    done: simulation.done
  };
}

function updateBestGapDistance(simulation) {
  // If two birds have equal pipe scores, prefer the one that got closer
  // to a gap while it was relevant. This helps selection before any bird
  // has successfully passed a pipe.
  const nextPipe = getNextHeadlessPipe(simulation);

  if (!nextPipe) {
    return;
  }

  const horizontalDistance = nextPipe.x - simulation.bird.x;
  const pipeIsNearBird =
    horizontalDistance >= -SIMULATION_PIPE_WIDTH &&
    horizontalDistance <= 160;

  if (!pipeIsNearBird) {
    return;
  }

  const gapCenter = nextPipe.top + SIMULATION_PIPE_GAP / 2;
  const verticalDistance = Math.abs(gapCenter - simulation.bird.y);
  simulation.bestGapDistance = Math.min(
    simulation.bestGapDistance,
    verticalDistance
  );
}