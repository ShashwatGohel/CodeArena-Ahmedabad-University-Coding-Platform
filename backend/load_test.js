const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const CONCURRENT_SUBMISSIONS = 200;

// Valid "Hello World" codes for different languages
const LANGUAGE_CODES = {
    c: `#include <stdio.h>\nint main() { printf("Hello from C\\n"); return 0; }`,
    cpp: `#include <iostream>\nint main() { std::cout << "Hello from C++" << std::endl; return 0; }`,
    python: `print("Hello from Python")`,
    java: `public class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }`
};

const LANGUAGES = Object.keys(LANGUAGE_CODES);

async function runStressTest() {
    try {
        console.log('--- Starting Multi-User, Multi-Language Stress Test ---');
        
        // 1. Get real data for context
        const studentsRes = await axios.get(`${API_URL}/students`);
        const studentId = studentsRes.data[0]?._id || '65f1a2b3c4d5e6f7a8b9c0d1';

        const contestsRes = await axios.get(`${API_URL}/contests/student/${studentId}`);
        const contestId = contestsRes.data[0]?._id || '65f1a2b3c4d5e6f7a8b9c0d3';

        const problemsRes = await axios.get(`${API_URL}/problems/contest/${contestId}`);
        const problemId = problemsRes.data[0]?._id || '65f1a2b3c4d5e6f7a8b9c0d2';

        console.log(`Base Context Found. Preparing ${CONCURRENT_SUBMISSIONS} unique submissions...`);
        
        const startTime = Date.now();
        const requests = [];

        for (let i = 0; i < CONCURRENT_SUBMISSIONS; i++) {
            // Pick a random language
            const lang = LANGUAGES[i % LANGUAGES.length];
            const code = LANGUAGE_CODES[lang];
            
            // Simulate a unique student by incrementing the last few chars of the ID
            // This bypasses the "one user" limitation for testing
            const fakeStudentId = studentId.substring(0, 20) + (i + 1000).toString(16).padStart(4, '0');

            requests.push(
                axios.post(`${API_URL}/submissions`, {
                    studentId: fakeStudentId,
                    problemId,
                    contestId,
                    code: code,
                    language: lang
                }).catch(err => ({ error: err.message, status: err.response?.status }))
            );
        }

        console.log(`Firing 200 submissions (Mix of C, C++, Python, Java)...`);
        const results = await Promise.all(requests);
        
        const successful = results.filter(r => r.status === 202).length;
        const langCounts = results.reduce((acc, r, i) => {
            if (r.status === 202) {
                const lang = LANGUAGES[i % LANGUAGES.length];
                acc[lang] = (acc[lang] || 0) + 1;
            }
            return acc;
        }, {});

        const duration = Date.now() - startTime;
        console.log('\n--- Stress Test Results ---');
        console.log(`Total Time to Queue: ${duration}ms`);
        console.log(`Successfully Queued: ${successful}`);
        console.log('Language Breakdown:', langCounts);
        
        console.log('\n✅ SUBMISSION PHASE COMPLETE.');
        console.log('Now, check your "Judge Worker" terminal.');
        console.log('You will see it switching between GCC, G++, Python, and Java compilers in real-time!');
        
    } catch (error) {
        console.error('\n❌ Stress Test failed:', error.message);
    }
}

runStressTest();
