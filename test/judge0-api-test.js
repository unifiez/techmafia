const API_URL = "https://ce.judge0.com/submissions?wait=true";

const tests = [
  {
    name: "C",
    language_id: 50,
    source_code:
      '#include <stdio.h>\nint main() { printf("C_WORKING"); return 0; }',
    expected: "C_WORKING",
  },
  {
    name: "C++",
    language_id: 54,
    source_code:
      '#include <iostream>\nusing namespace std;\nint main() { cout << "CPP_WORKING"; return 0; }',
    expected: "CPP_WORKING",
  },
];

async function testLanguage(test) {
  console.log(`\nTesting ${test.name}...`);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: test.source_code,
        language_id: test.language_id,
        stdin: "",
      }),
      signal: AbortSignal.timeout(30000),
    });

    const body = await response.text();

    if (response.status === 429) {
      console.log("LIMITED: HTTP 429 - Too many requests.");
      console.log(body);
      return false;
    }

    if (!response.ok) {
      console.log(`HTTP ERROR: ${response.status}`);
      console.log(body);
      return false;
    }

    let result;

    try {
      result = JSON.parse(body);
    } catch {
      console.log("ERROR: Response was not valid JSON.");
      console.log(body);
      return false;
    }

    console.log("HTTP Status:", response.status);
    console.log("Compile/Run Status:", result.status?.description);
    console.log("Output:", JSON.stringify(result.stdout));
    console.log("Compiler Error:", result.compile_output || "None");
    console.log("Runtime Error:", result.stderr || "None");

    const passed =
      result.status?.id === 3 &&
      result.stdout?.trim() === test.expected;

    console.log(passed ? "PASS" : "FAIL");
    return passed;
  } catch (error) {
    if (error.name === "TimeoutError" ||
        error.name === "AbortError") {
      console.log("TIMEOUT: The API took too long to respond.");
    } else {
      console.log("NETWORK ERROR:", error.message);
    }

    return false;
  }
}

async function main() {
  console.log("Judge0 API connectivity test");
  console.log("Endpoint:", API_URL);

  let passed = 0;

  for (const test of tests) {
    if (await testLanguage(test)) {
      passed++;
    }
  }

  console.log(`\nResult: ${passed}/${tests.length} tests passed.`);

  if (passed === tests.length) {
    console.log("SUCCESS: C and C++ execution are working!");
  } else {
    console.log("Some tests failed. Check the errors above.");
  }
}

main();
