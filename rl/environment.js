let episodeReward = 0;
let rewardedPipe = null;
let progressRewardGiven = false;
let nearRewardGiven = false;

function getNextPipe() {
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
    episodeReward = 0;
    rewardedPipe = null;
    progressRewardGiven = false;
    nearRewardGiven = false;

    startGame();

    return getObservation();
}

function flap(){
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

    if (currentScore > previousScore) {
        stepReward += 3;
    }

    if (done) {
        stepReward -= 2;
    }

    if (afterPipe !== rewardedPipe) {
        rewardedPipe = afterPipe;
        progressRewardGiven = false;
        nearRewardGiven = false;
    }

    const samePipe =
        beforePipe &&
        afterPipe &&
        beforePipe === afterPipe;

    if (samePipe && beforeObservation && afterObservation) {
        if (
        !progressRewardGiven &&
        beforeObservation.distanceToGapCenter > 250 &&
        afterObservation.distanceToGapCenter <= 250
        ) {
        stepReward += 1;
        progressRewardGiven = true;
        }

        if (
        !nearRewardGiven &&
        beforeObservation.distanceToGapCenter > 50 &&
        afterObservation.distanceToGapCenter <= 50
        ) {
        stepReward += 2;
        nearRewardGiven = true;
        }
    }

    return stepReward;
}


async function step(action) {
    if (action !== 0 && action !== 1) {
        throw new Error('Action must be 0 or 1');
    }

    const beforeState = getGameState();
    const beforeObservation = getObservation();
    const beforePipe = getNextPipe();

    if (action === 1) {
        flap();
    }

    await new Promise(resolve => requestAnimationFrame(resolve));

    const afterState = getGameState();
    const afterObservation = getObservation();
    const afterPipe = getNextPipe();
    const done = gameState === STATE.GAMEOVER;

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

    return {
        observation: afterObservation,
        reward: stepReward,
        done,
        episodeReward
    };
}