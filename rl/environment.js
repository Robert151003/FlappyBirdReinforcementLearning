// This file is a browser-facing RL adapter around the existing game.
// It exposes the usual environment operations:
//
//   observation -> action -> next observation, reward, done
//
// The evolutionary trainer uses rl/simulation.js instead because this
// adapter depends on the real DOM game and requestAnimationFrame.
let episodeReward = 0;
let rewardedPipe = null;
let nearRewardGiven = false;

function getNextPipe() {
    // The policy only needs the first pipe that the bird has not passed.
    const state = getGameState();

    return state.pipes.find(
        pipe => pipe.x + pipes.width >= bird.x
    );
}


function getObservation() {
    const state = getGameState();
    const nextPipe = getNextPipe();

    if (!nextPipe) {
        return null;
    }

    // Convert raw game state into features an agent can use.
    // The vertical distance is signed: positive means the gap is below
    // the bird and negative means it is above the bird.
    const gapCenter = nextPipe.top + pipes.gap / 2;
    const horizontalDistance = nextPipe.x - bird.x;
    const verticalDistance = gapCenter - state.birdY;

    return {
        birdY: state.birdY,
        birdVelocity: state.birdVelocity,
        distanceToPipe: horizontalDistance,
        verticalDistanceToGapCenter: verticalDistance,
        distanceToGapCenter: Math.hypot(
            horizontalDistance,
            verticalDistance
        )
    };
}


function reset() {
    // Reset both the game and the reward bookkeeping for a new episode.
    episodeReward = 0;
    rewardedPipe = null;
    nearRewardGiven = false;

    startGame();

    return getObservation();
}

function flap(){
    // Action 1 means flap. Action 0 means let physics continue naturally.
    bird.flap();
}

function calculateStepReward(
    beforeObservation,
    afterObservation,
    beforePipe,
    afterPipe,
    previousScore,
    currentScore,
    done
) {
    let stepReward = 0;

    // Reward events are sparse and meaningful:
    // passing a pipe is the main objective.
    if (currentScore > previousScore) {
        stepReward += 3;
    }

    if (done) {
        // Death is discouraged, but the penalty is smaller than the
        // pipe reward so the agent still has a useful learning signal.
        stepReward -= 2;
    }

    if (afterPipe !== rewardedPipe) {
        // Reward the near-gap event at most once for each pipe.
        rewardedPipe = afterPipe;
        nearRewardGiven = false;
    }

    const samePipe =
        beforePipe &&
        afterPipe &&
        beforePipe === afterPipe;

    if (samePipe && beforeObservation && afterObservation) {
        if (
            !nearRewardGiven &&
            beforeObservation.distanceToGapCenter > 50 &&
            afterObservation.distanceToGapCenter <= 50
        ) {
            // This shaping reward encourages the bird to approach the
            // current gap, but does not award distance-based progress.
            stepReward += 2;
            nearRewardGiven = true;
        }
    }

    return stepReward;
}


async function step(action) {
    // Validate the discrete action space before changing the game.
    if (action !== 0 && action !== 1) {
        throw new Error('Action must be 0 or 1');
    }

    const beforeState = getGameState();
    const beforeObservation = getObservation();
    const beforePipe = getNextPipe();

    if (action === 1) {
        flap();
    }

    // The browser game advances asynchronously, one rendered frame at a time.
    await new Promise(resolve => requestAnimationFrame(resolve));

    const afterState = getGameState();
    const afterObservation = getObservation();
    const afterPipe = getNextPipe();
    const done = gameState === STATE.GAMEOVER;

    // Compare the state before and after the frame to detect events that
    // happened during this action.
    const stepReward = calculateStepReward(
        beforeObservation,
        afterObservation,
        beforePipe,
        afterPipe,
        beforeState.score,
        afterState.score,
        done
    );

    episodeReward += stepReward;

    // This is the standard environment transition returned to an agent.
    return {
        observation: afterObservation,
        reward: stepReward,
        done,
        episodeReward
    };
}