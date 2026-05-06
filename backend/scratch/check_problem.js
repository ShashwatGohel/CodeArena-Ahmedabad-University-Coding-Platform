const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Problem = require('../models/Problem');

async function checkProblem() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const problem = await Problem.findOne({ title: /Sum of Two Integers/i });
        if (problem) {
            console.log('Problem Found:', problem.title);
            console.log('Points:', problem.points);
            console.log('Test Cases Count:', problem.testCases.length);
        } else {
            console.log('Problem not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkProblem();
