import type { IProblem, ProblemModule, TestCase } from "../models";

type ProblemSeed = Omit<IProblem, "createdAt" | "updatedAt" | "_id" | "active"> & {
  active?: boolean;
};

const m = (
  key: string,
  title: string,
  description: string,
  role: string,
): ProblemModule => ({ key, title, description, role });

/**
 * The 20-problem beginner C bank supplied by the organizers.
 *
 * Every template is a complete C program split into four module fences
 * (m1..m4) so each of the four teammates owns exactly one region (see
 * lib/game/code.ts). `String.raw` keeps C escape sequences (e.g. \n) intact.
 *
 * Problems 15-17 are described as classes; since the judge compiles C they are
 * implemented with C structs.
 */
export const problemSeeds: ProblemSeed[] = [
  {
    key: "p1",
    number: 1,
    title: "Find the Largest of Two Numbers",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Input/output", "Comparison", "if-else"],
    description: String.raw`Given two integers a and b, print the larger number.
If both are equal, print either number.

INPUT FORMAT: <a> <b>   (two space-separated integers)
OUTPUT FORMAT: the larger number.`,
    modules: [
      m("m1", "Read Two", "Read two integers into *a and *b. Return 1 on success.", "Coder 1"),
      m("m2", "Max of Two", "Return the larger of x and y.", "Coder 2"),
      m("m3", "Largest", "Return the largest of a and b (use max2).", "Coder 3"),
      m("m4", "Report", "Print the value followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_two(int *a, int *b);
int max2(int x, int y);
int largest(int a, int b);
void report(int value);

int main(void) {
    int a, b;
    if (!read_two(&a, &b)) { printf("Error\n"); return 0; }
    report(largest(a, b));
    return 0;
}

/*<m1>*/
int read_two(int *a, int *b) {
    /* MODULE 1 (Coder 1): read two integers with scanf. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int max2(int x, int y) {
    /* MODULE 2 (Coder 2): return the larger of x and y. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int largest(int a, int b) {
    /* MODULE 3 (Coder 3): return max2(a, b). */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "10 20\n", expectedOutput: "20" },
      { name: "Sample 2", input: "7 3\n", expectedOutput: "7" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "5 5\n", expectedOutput: "5" }],
  },

  {
    key: "p2",
    number: 2,
    title: "Even or Odd",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Modulus operator", "if-else", "Strings"],
    description: String.raw`Given an integer n, determine whether it is even or odd.

INPUT FORMAT: <n>   (one integer)
OUTPUT FORMAT: "Even" if n is even, otherwise "Odd".`,
    modules: [
      m("m1", "Read Integer", "Read one integer. Return 1 on success.", "Coder 1"),
      m("m2", "Is Even", "Return 1 when n is even, otherwise 0 (use %).", "Coder 2"),
      m("m3", "Parity Word", "Return \"Even\" or \"Odd\" using is_even.", "Coder 3"),
      m("m4", "Report", "Print the word followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int is_even(int n);
const char *parity(int n);
void report(const char *word);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    report(parity(n));
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int is_even(int n) {
    /* MODULE 2 (Coder 2): return 1 when n is even, otherwise 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
const char *parity(int n) {
    /* MODULE 3 (Coder 3): return "Even" or "Odd" using is_even. */
    return "";
}
/*</m3>*/

/*<m4>*/
void report(const char *word) {
    /* MODULE 4 (Coder 4): print word then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "8\n", expectedOutput: "Even" },
      { name: "Sample 2", input: "7\n", expectedOutput: "Odd" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "0\n", expectedOutput: "Even" }],
  },

  {
    key: "p3",
    number: 3,
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Input/output", "Arithmetic operators"],
    description: String.raw`Given two integers a and b, print their sum.

INPUT FORMAT: <a> <b>   (two space-separated integers)
OUTPUT FORMAT: the sum a + b.`,
    modules: [
      m("m1", "Read Two", "Read two integers. Return 1 on success.", "Coder 1"),
      m("m2", "Add", "Return the sum a + b.", "Coder 2"),
      m("m3", "Sum Pair", "Return add(a, b).", "Coder 3"),
      m("m4", "Report", "Print the value followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_two(int *a, int *b);
int add(int a, int b);
int sum_pair(int a, int b);
void report(int value);

int main(void) {
    int a, b;
    if (!read_two(&a, &b)) { printf("Error\n"); return 0; }
    report(sum_pair(a, b));
    return 0;
}

/*<m1>*/
int read_two(int *a, int *b) {
    /* MODULE 1 (Coder 1): read two integers. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int add(int a, int b) {
    /* MODULE 2 (Coder 2): return a + b. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int sum_pair(int a, int b) {
    /* MODULE 3 (Coder 3): return add(a, b). */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "10 20\n", expectedOutput: "30" },
      { name: "Sample 2", input: "-5 8\n", expectedOutput: "3" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "0 0\n", expectedOutput: "0" }],
  },

  {
    key: "p4",
    number: 4,
    title: "Area of a Rectangle",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Arithmetic operators", "Validation"],
    description: String.raw`Given the length and breadth of a rectangle, calculate its area.
Area = length * breadth.

INPUT FORMAT: <length> <breadth>   (two integers)
OUTPUT FORMAT: the area.`,
    modules: [
      m("m1", "Read Two", "Read length and breadth. Return 1 on success.", "Coder 1"),
      m("m2", "Valid Sides", "Return 1 when both sides are non-negative, otherwise 0.", "Coder 2"),
      m("m3", "Area", "Return length * breadth.", "Coder 3"),
      m("m4", "Report", "Print the area followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_two(int *length, int *breadth);
int valid_sides(int length, int breadth);
int area(int length, int breadth);
void report(int value);

int main(void) {
    int length, breadth;
    if (!read_two(&length, &breadth)) { printf("Error\n"); return 0; }
    if (!valid_sides(length, breadth)) { printf("Error\n"); return 0; }
    report(area(length, breadth));
    return 0;
}

/*<m1>*/
int read_two(int *length, int *breadth) {
    /* MODULE 1 (Coder 1): read two integers. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int valid_sides(int length, int breadth) {
    /* MODULE 2 (Coder 2): return 1 when length >= 0 and breadth >= 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int area(int length, int breadth) {
    /* MODULE 3 (Coder 3): return length * breadth. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5 4\n", expectedOutput: "20" },
      { name: "Sample 2", input: "10 3\n", expectedOutput: "30" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "7 7\n", expectedOutput: "49" }],
  },

  {
    key: "p5",
    number: 5,
    title: "Simple Calculator",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Arithmetic operators", "switch/if-else"],
    description: String.raw`Given two integers and an operator (+, -, *, or /), perform the operation.
For division, print the integer quotient. The divisor will not be zero.

INPUT FORMAT: <a> <b> <op>   (two integers then an operator, space separated)
OUTPUT FORMAT: the result.`,
    modules: [
      m("m1", "Read Expression", "Read a, b and the operator. Return 1 on success.", "Coder 1"),
      m("m2", "Operator Check", "Return 1 when op is one of + - * /.", "Coder 2"),
      m("m3", "Compute", "Return a op b (integer division for /).", "Coder 3"),
      m("m4", "Report", "Print the result followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_expr(int *a, int *b, char *op);
int op_valid(char op);
int compute(int a, int b, char op);
void report(int value);

int main(void) {
    int a, b;
    char op;
    if (!read_expr(&a, &b, &op)) { printf("Error\n"); return 0; }
    if (!op_valid(op)) { printf("Error\n"); return 0; }
    report(compute(a, b, op));
    return 0;
}

/*<m1>*/
int read_expr(int *a, int *b, char *op) {
    /* MODULE 1 (Coder 1): read "<a> <b> <op>" with scanf. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int op_valid(char op) {
    /* MODULE 2 (Coder 2): return 1 when op is + - * / */
    return 0;
}
/*</m2>*/

/*<m3>*/
int compute(int a, int b, char op) {
    /* MODULE 3 (Coder 3): perform the arithmetic for op. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "10 5 +\n", expectedOutput: "15" },
      { name: "Sample 2", input: "10 5 -\n", expectedOutput: "5" },
    ],
    hiddenTests: [
      { name: "Hidden 1", input: "6 4 *\n", expectedOutput: "24" },
      { name: "Hidden 2", input: "9 2 /\n", expectedOutput: "4" },
    ],
  },

  {
    key: "p6",
    number: 6,
    title: "Largest of Three Numbers",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Comparison operators", "Conditional statements"],
    description: String.raw`Given three integers a, b and c, print the largest number.

INPUT FORMAT: <a> <b> <c>   (three space-separated integers)
OUTPUT FORMAT: the largest number.`,
    modules: [
      m("m1", "Read Three", "Read three integers. Return 1 on success.", "Coder 1"),
      m("m2", "Max of Two", "Return the larger of x and y.", "Coder 2"),
      m("m3", "Largest", "Return the largest of a, b, c using max2.", "Coder 3"),
      m("m4", "Report", "Print the largest value followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_three(int *a, int *b, int *c);
int max2(int x, int y);
int largest(int a, int b, int c);
void report(int value);

int main(void) {
    int a, b, c;
    if (!read_three(&a, &b, &c)) { printf("Error\n"); return 0; }
    report(largest(a, b, c));
    return 0;
}

/*<m1>*/
int read_three(int *a, int *b, int *c) {
    /* MODULE 1 (Coder 1): read three integers. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int max2(int x, int y) {
    /* MODULE 2 (Coder 2): return the larger of x and y. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int largest(int a, int b, int c) {
    /* MODULE 3 (Coder 3): return the largest of a, b, c using max2. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "10 20 15\n", expectedOutput: "20" },
      { name: "Sample 2", input: "5 2 9\n", expectedOutput: "9" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "7 7 3\n", expectedOutput: "7" }],
  },

  {
    key: "p7",
    number: 7,
    title: "Multiplication Table",
    difficulty: "Easy",
    weight: 100,
    concepts: ["for loop", "Arithmetic operators"],
    description: String.raw`Given an integer n, print its multiplication table from 1 to 10.

INPUT FORMAT: <n>   (one integer)
OUTPUT FORMAT: ten lines in the format  n x i = result`,
    modules: [
      m("m1", "Read Integer", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Valid Step", "Return 1 when i is between 1 and 10 inclusive.", "Coder 2"),
      m("m3", "Product", "Return n * i.", "Coder 3"),
      m("m4", "Print Table", "Loop i = 1..10 and print each line using valid_step and product.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int valid_step(int i);
int product(int n, int i);
void print_table(int n);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    print_table(n);
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int valid_step(int i) {
    /* MODULE 2 (Coder 2): return 1 when i is between 1 and 10 inclusive. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int product(int n, int i) {
    /* MODULE 3 (Coder 3): return n * i. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void print_table(int n) {
    /* MODULE 4 (Coder 4): for i = 1..10 print "n x i = product\n"
       using valid_step and product. */
}
/*</m4>*/
`,
    publicTests: [
      {
        name: "Sample 1",
        input: "2\n",
        expectedOutput:
          "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20",
      },
    ],
    hiddenTests: [
      {
        name: "Hidden 1",
        input: "5\n",
        expectedOutput:
          "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50",
      },
    ],
  },

  {
    key: "p8",
    number: 8,
    title: "Sum from 1 to N",
    difficulty: "Easy",
    weight: 100,
    concepts: ["for loop", "Accumulator"],
    description: String.raw`Given a positive integer n, calculate the sum of all integers from 1 to n.

INPUT FORMAT: <n>   (one positive integer)
OUTPUT FORMAT: the sum.`,
    modules: [
      m("m1", "Read Integer", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Is Positive", "Return 1 when n >= 1, otherwise 0.", "Coder 2"),
      m("m3", "Sum To N", "Return 1 + 2 + ... + n.", "Coder 3"),
      m("m4", "Report", "Print the sum followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int is_positive(int n);
int sum_to_n(int n);
void report(int value);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    if (!is_positive(n)) { printf("Error\n"); return 0; }
    report(sum_to_n(n));
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int is_positive(int n) {
    /* MODULE 2 (Coder 2): return 1 when n >= 1. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int sum_to_n(int n) {
    /* MODULE 3 (Coder 3): return the sum 1..n. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5\n", expectedOutput: "15" },
      { name: "Sample 2", input: "10\n", expectedOutput: "55" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "1\n", expectedOutput: "1" }],
  },

  {
    key: "p9",
    number: 9,
    title: "Factorial of a Number",
    difficulty: "Easy",
    weight: 100,
    concepts: ["Loops", "Multiplication", "Validation"],
    description: String.raw`Given a non-negative integer n, calculate its factorial.
The factorial of 0 is 1.

INPUT FORMAT: <n>   (0 <= n <= 12)
OUTPUT FORMAT: n factorial.`,
    modules: [
      m("m1", "Read Integer", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Non Negative", "Return 1 when n >= 0, otherwise 0.", "Coder 2"),
      m("m3", "Factorial", "Return n! using a loop. 0! = 1.", "Coder 3"),
      m("m4", "Report", "Print the factorial followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int non_negative(int n);
int factorial(int n);
void report(int value);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    if (!non_negative(n)) { printf("Error\n"); return 0; }
    report(factorial(n));
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int non_negative(int n) {
    /* MODULE 2 (Coder 2): return 1 when n >= 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int factorial(int n) {
    /* MODULE 3 (Coder 3): return n! with a loop. 0! = 1. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5\n", expectedOutput: "120" },
      { name: "Sample 2", input: "3\n", expectedOutput: "6" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "0\n", expectedOutput: "1" }],
  },

  {
    key: "p10",
    number: 10,
    title: "Sum of Digits",
    difficulty: "Easy",
    weight: 100,
    concepts: ["while loop", "Modulus operator"],
    description: String.raw`Given an integer n, calculate the sum of its digits.
If n is negative, ignore the minus sign.

INPUT FORMAT: <n>   (one integer)
OUTPUT FORMAT: the sum of its digits.`,
    modules: [
      m("m1", "Read Integer", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Absolute Value", "Return the absolute value of n.", "Coder 2"),
      m("m3", "Digit Sum", "Return the sum of the digits of a non-negative number.", "Coder 3"),
      m("m4", "Report", "Print the sum followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int abs_int(int n);
int digit_sum(int n);
void report(int value);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    report(digit_sum(abs_int(n)));
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int abs_int(int n) {
    /* MODULE 2 (Coder 2): return the absolute value of n. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int digit_sum(int n) {
    /* MODULE 3 (Coder 3): return the sum of the digits of n (n >= 0). */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "1234\n", expectedOutput: "10" },
      { name: "Sample 2", input: "567\n", expectedOutput: "18" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "0\n", expectedOutput: "0" }],
  },

  {
    key: "p11",
    number: 11,
    title: "Reverse a Number",
    difficulty: "Easy",
    weight: 100,
    concepts: ["while loop", "Modulus operator"],
    description: String.raw`Given a non-negative integer n, reverse its digits and print the result
without leading zeros.

INPUT FORMAT: <n>   (one non-negative integer)
OUTPUT FORMAT: the reversed number.`,
    modules: [
      m("m1", "Read Integer", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Non Negative", "Return 1 when n >= 0, otherwise 0.", "Coder 2"),
      m("m3", "Reverse Digits", "Return n with its digits reversed.", "Coder 3"),
      m("m4", "Report", "Print the reversed number followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_int(int *n);
int non_negative(int n);
int reverse_digits(int n);
void report(int value);

int main(void) {
    int n;
    if (!read_int(&n)) { printf("Error\n"); return 0; }
    if (!non_negative(n)) { printf("Error\n"); return 0; }
    report(reverse_digits(n));
    return 0;
}

/*<m1>*/
int read_int(int *n) {
    /* MODULE 1 (Coder 1): read one integer. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int non_negative(int n) {
    /* MODULE 2 (Coder 2): return 1 when n >= 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int reverse_digits(int n) {
    /* MODULE 3 (Coder 3): return n with its digits reversed (no leading zeros). */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "1234\n", expectedOutput: "4321" },
      { name: "Sample 2", input: "120\n", expectedOutput: "21" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "7\n", expectedOutput: "7" }],
  },

  {
    key: "p12",
    number: 12,
    title: "Array Sum",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Arrays", "Loops"],
    description: String.raw`Given n integers, calculate their sum.

INPUT FORMAT:
  line 1: <n>          (1 <= n <= 1000)
  line 2: n space-separated integers
OUTPUT FORMAT: the sum of the array elements.`,
    modules: [
      m("m1", "Read Count", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Read Array", "Read n integers into arr. Return 1 on success.", "Coder 2"),
      m("m3", "Array Sum", "Return the sum of the first n elements of arr.", "Coder 3"),
      m("m4", "Report", "Print the sum followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_count(int *n);
int read_array(int arr[], int n);
int array_sum(const int arr[], int n);
void report(int value);

int main(void) {
    int n;
    int arr[1000];
    if (!read_count(&n)) { printf("Error\n"); return 0; }
    if (!read_array(arr, n)) { printf("Error\n"); return 0; }
    report(array_sum(arr, n));
    return 0;
}

/*<m1>*/
int read_count(int *n) {
    /* MODULE 1 (Coder 1): read n. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int read_array(int arr[], int n) {
    /* MODULE 2 (Coder 2): read n integers into arr. Return 1 on success. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int array_sum(const int arr[], int n) {
    /* MODULE 3 (Coder 3): return the sum of arr[0..n-1]. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5\n1 2 3 4 5\n", expectedOutput: "15" },
      { name: "Sample 2", input: "3\n10 20 30\n", expectedOutput: "60" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "4\n-1 2 -3 4\n", expectedOutput: "2" }],
  },

  {
    key: "p13",
    number: 13,
    title: "Linear Search",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Arrays", "Search"],
    description: String.raw`Given an array of integers and a target value, print the zero-based index of the
first occurrence of the target. If the target is not present, print -1.

INPUT FORMAT:
  line 1: <n>
  line 2: n space-separated integers
  line 3: <target>
OUTPUT FORMAT: the index or -1.`,
    modules: [
      m("m1", "Read Count", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Read Array", "Read n integers into arr. Return 1 on success.", "Coder 2"),
      m("m3", "Read Target", "Read the target value. Return 1 on success.", "Coder 3"),
      m("m4", "First Index", "Return the first index of target in arr, or -1.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_count(int *n);
int read_array(int arr[], int n);
int read_target(int *target);
int first_index(const int arr[], int n, int target);

int main(void) {
    int n, target;
    int arr[1000];
    if (!read_count(&n)) { printf("Error\n"); return 0; }
    if (!read_array(arr, n)) { printf("Error\n"); return 0; }
    if (!read_target(&target)) { printf("Error\n"); return 0; }
    printf("%d\n", first_index(arr, n, target));
    return 0;
}

/*<m1>*/
int read_count(int *n) {
    /* MODULE 1 (Coder 1): read n. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int read_array(int arr[], int n) {
    /* MODULE 2 (Coder 2): read n integers into arr. Return 1 on success. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int read_target(int *target) {
    /* MODULE 3 (Coder 3): read the target value. Return 1 on success. */
    return 0;
}
/*</m3>*/

/*<m4>*/
int first_index(const int arr[], int n, int target) {
    /* MODULE 4 (Coder 4): return the first index of target, or -1. */
    return -1;
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5\n10 20 30 40 50\n30\n", expectedOutput: "2" },
      { name: "Sample 2", input: "4\n1 2 3 4\n8\n", expectedOutput: "-1" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "3\n5 5 9\n5\n", expectedOutput: "0" }],
  },

  {
    key: "p14",
    number: 14,
    title: "Count Vowels",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Strings", "Loops", "Character handling"],
    description: String.raw`Given a single word, count the vowels (a, e, i, o, u) in it.
Treat uppercase and lowercase letters equally.

INPUT FORMAT: <word>   (one word of English letters)
OUTPUT FORMAT: the number of vowels.`,
    modules: [
      m("m1", "Read Word", "Read a single word into word. Return 1 on success.", "Coder 1"),
      m("m2", "Is Vowel", "Return 1 when c is a vowel (case-insensitive).", "Coder 2"),
      m("m3", "Count Vowels", "Return the number of vowels in word.", "Coder 3"),
      m("m4", "Report", "Print the count followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_word(char word[]);
int is_vowel(char c);
int count_vowels(const char word[]);
void report(int value);

int main(void) {
    char word[64];
    if (!read_word(word)) { printf("Error\n"); return 0; }
    report(count_vowels(word));
    return 0;
}

/*<m1>*/
int read_word(char word[]) {
    /* MODULE 1 (Coder 1): read one word with scanf("%63s"). Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int is_vowel(char c) {
    /* MODULE 2 (Coder 2): return 1 for a,e,i,o,u in either case, else 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int count_vowels(const char word[]) {
    /* MODULE 3 (Coder 3): count vowels in word using is_vowel. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "hello\n", expectedOutput: "2" },
      { name: "Sample 2", input: "SKIT\n", expectedOutput: "1" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "rhythm\n", expectedOutput: "0" }],
  },

  {
    key: "p15",
    number: 15,
    title: "Student Class Total",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Structs", "Functions", "Validation"],
    description: String.raw`Create a Student (struct with a name and marks in three subjects).
Calculate and print the total marks.

INPUT FORMAT: <name> <mark1> <mark2> <mark3>
OUTPUT FORMAT: the total marks only.  (each mark is between 0 and 100)`,
    modules: [
      m("m1", "Read Student", "Read a name and three marks into *s. Return 1 on success.", "Coder 1"),
      m("m2", "Valid Marks", "Return 1 when every mark is between 0 and 100 inclusive.", "Coder 2"),
      m("m3", "Total Marks", "Return the sum of the three marks.", "Coder 3"),
      m("m4", "Report", "Print the total followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

struct Student {
    char name[64];
    int mark1;
    int mark2;
    int mark3;
};

int read_student(struct Student *s);
int valid_marks(const struct Student *s);
int total_marks(const struct Student *s);
void report(int value);

int main(void) {
    struct Student s;
    if (!read_student(&s)) { printf("Error\n"); return 0; }
    if (!valid_marks(&s)) { printf("Error\n"); return 0; }
    report(total_marks(&s));
    return 0;
}

/*<m1>*/
int read_student(struct Student *s) {
    /* MODULE 1 (Coder 1): read name and three integer marks. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int valid_marks(const struct Student *s) {
    /* MODULE 2 (Coder 2): every mark must be 0..100 inclusive. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int total_marks(const struct Student *s) {
    /* MODULE 3 (Coder 3): return mark1 + mark2 + mark3. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [{ name: "Sample 1", input: "Aman 80 75 90\n", expectedOutput: "245" }],
    hiddenTests: [{ name: "Hidden 1", input: "Riya 60 70 80\n", expectedOutput: "210" }],
  },

  {
    key: "p16",
    number: 16,
    title: "Rectangle Class Area",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Structs", "Functions"],
    description: String.raw`Create a Rectangle (struct with a length and breadth).
Calculate and print its area.

INPUT FORMAT: <length> <breadth>   (two integers)
OUTPUT FORMAT: the area.`,
    modules: [
      m("m1", "Read Rectangle", "Read length and breadth into *r. Return 1 on success.", "Coder 1"),
      m("m2", "Valid Sides", "Return 1 when both sides are non-negative.", "Coder 2"),
      m("m3", "Area", "Return length * breadth.", "Coder 3"),
      m("m4", "Report", "Print the area followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

struct Rectangle {
    int length;
    int breadth;
};

int read_rectangle(struct Rectangle *r);
int valid_sides(const struct Rectangle *r);
int area(const struct Rectangle *r);
void report(int value);

int main(void) {
    struct Rectangle r;
    if (!read_rectangle(&r)) { printf("Error\n"); return 0; }
    if (!valid_sides(&r)) { printf("Error\n"); return 0; }
    report(area(&r));
    return 0;
}

/*<m1>*/
int read_rectangle(struct Rectangle *r) {
    /* MODULE 1 (Coder 1): read length and breadth. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int valid_sides(const struct Rectangle *r) {
    /* MODULE 2 (Coder 2): return 1 when both sides are >= 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
int area(const struct Rectangle *r) {
    /* MODULE 3 (Coder 3): return length * breadth. */
    return 0;
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [{ name: "Sample 1", input: "5 4\n", expectedOutput: "20" }],
    hiddenTests: [{ name: "Hidden 1", input: "10 3\n", expectedOutput: "30" }],
  },

  {
    key: "p17",
    number: 17,
    title: "Bank Account Balance",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Structs", "Conditional statements"],
    description: String.raw`Create a BankAccount (struct with a balance).
Read the initial balance, deposit amount and withdrawal amount. Apply the deposit,
then withdraw only if the amount does not exceed the available balance.

INPUT FORMAT: <initial> <deposit> <withdrawal>   (three non-negative integers)
OUTPUT FORMAT: the final balance.`,
    modules: [
      m("m1", "Read Account", "Read initial balance, deposit and withdrawal. Return 1 on success.", "Coder 1"),
      m("m2", "Deposit", "Add the deposit amount to the balance.", "Coder 2"),
      m("m3", "Withdraw", "Subtract the withdrawal only when it does not exceed the balance.", "Coder 3"),
      m("m4", "Report", "Print the final balance followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

struct BankAccount {
    int balance;
};

int read_account(struct BankAccount *a, int *deposit, int *withdrawal);
void deposit_amount(struct BankAccount *a, int amount);
void withdraw_amount(struct BankAccount *a, int amount);
void report(int value);

int main(void) {
    struct BankAccount a;
    int deposit, withdrawal;
    if (!read_account(&a, &deposit, &withdrawal)) { printf("Error\n"); return 0; }
    deposit_amount(&a, deposit);
    withdraw_amount(&a, withdrawal);
    report(a.balance);
    return 0;
}

/*<m1>*/
int read_account(struct BankAccount *a, int *deposit, int *withdrawal) {
    /* MODULE 1 (Coder 1): read balance, deposit and withdrawal. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
void deposit_amount(struct BankAccount *a, int amount) {
    /* MODULE 2 (Coder 2): a->balance += amount; */
}
/*</m2>*/

/*<m3>*/
void withdraw_amount(struct BankAccount *a, int amount) {
    /* MODULE 3 (Coder 3): subtract amount only if amount <= a->balance. */
}
/*</m3>*/

/*<m4>*/
void report(int value) {
    /* MODULE 4 (Coder 4): print value then a newline. */
}
/*</m4>*/
`,
    publicTests: [{ name: "Sample 1", input: "1000 500 200\n", expectedOutput: "1300" }],
    hiddenTests: [{ name: "Hidden 1", input: "500 100 800\n", expectedOutput: "600" }],
  },

  {
    key: "p18",
    number: 18,
    title: "Sort an Array",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Arrays", "Sorting", "Loops"],
    description: String.raw`Given n integers, print them in ascending order.

INPUT FORMAT:
  line 1: <n>          (1 <= n <= 1000)
  line 2: n space-separated integers
OUTPUT FORMAT: the sorted integers separated by spaces.`,
    modules: [
      m("m1", "Read Count", "Read n. Return 1 on success.", "Coder 1"),
      m("m2", "Read Array", "Read n integers into arr. Return 1 on success.", "Coder 2"),
      m("m3", "Sort Array", "Sort arr[0..n-1] in ascending order.", "Coder 3"),
      m("m4", "Print Array", "Print the n elements separated by spaces.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_count(int *n);
int read_array(int arr[], int n);
void sort_array(int arr[], int n);
void print_array(const int arr[], int n);

int main(void) {
    int n;
    int arr[1000];
    if (!read_count(&n)) { printf("Error\n"); return 0; }
    if (!read_array(arr, n)) { printf("Error\n"); return 0; }
    sort_array(arr, n);
    print_array(arr, n);
    return 0;
}

/*<m1>*/
int read_count(int *n) {
    /* MODULE 1 (Coder 1): read n. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int read_array(int arr[], int n) {
    /* MODULE 2 (Coder 2): read n integers into arr. Return 1 on success. */
    return 0;
}
/*</m2>*/

/*<m3>*/
void sort_array(int arr[], int n) {
    /* MODULE 3 (Coder 3): sort arr in ascending order (e.g. bubble sort). */
}
/*</m3>*/

/*<m4>*/
void print_array(const int arr[], int n) {
    /* MODULE 4 (Coder 4): print elements separated by spaces, ending with "\n". */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "5\n5 2 4 1 3\n", expectedOutput: "1 2 3 4 5" },
      { name: "Sample 2", input: "4\n9 7 8 6\n", expectedOutput: "6 7 8 9" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "3\n7 7 2\n", expectedOutput: "2 7 7" }],
  },

  {
    key: "p19",
    number: 19,
    title: "Classify a Character",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Characters", "Conditional statements"],
    description: String.raw`Given one English alphabet character, print Vowel if it is a, e, i, o or u
(case-insensitive); otherwise print Consonant.

INPUT FORMAT: <ch>   (one alphabet character)
OUTPUT FORMAT: "Vowel" or "Consonant".`,
    modules: [
      m("m1", "Read Character", "Read one character. Return 1 on success.", "Coder 1"),
      m("m2", "Is Vowel", "Return 1 when c is a vowel (case-insensitive).", "Coder 2"),
      m("m3", "Classify", "Return \"Vowel\" or \"Consonant\" using is_vowel.", "Coder 3"),
      m("m4", "Report", "Print the word followed by a newline.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_char(char *c);
int is_vowel(char c);
const char *classify(char c);
void report(const char *word);

int main(void) {
    char c;
    if (!read_char(&c)) { printf("Error\n"); return 0; }
    report(classify(c));
    return 0;
}

/*<m1>*/
int read_char(char *c) {
    /* MODULE 1 (Coder 1): read one non-space character. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
int is_vowel(char c) {
    /* MODULE 2 (Coder 2): return 1 for a,e,i,o,u in either case, else 0. */
    return 0;
}
/*</m2>*/

/*<m3>*/
const char *classify(char c) {
    /* MODULE 3 (Coder 3): return "Vowel" or "Consonant" using is_vowel. */
    return "";
}
/*</m3>*/

/*<m4>*/
void report(const char *word) {
    /* MODULE 4 (Coder 4): print word then a newline. */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "a\n", expectedOutput: "Vowel" },
      { name: "Sample 2", input: "B\n", expectedOutput: "Consonant" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "E\n", expectedOutput: "Vowel" }],
  },

  {
    key: "p20",
    number: 20,
    title: "Swap Two Numbers",
    difficulty: "Medium",
    weight: 100,
    concepts: ["Pointers", "Functions"],
    description: String.raw`Given two integers a and b, print their values in swapped order.

INPUT FORMAT: <a> <b>   (two space-separated integers)
OUTPUT FORMAT: b followed by a, separated by a space.`,
    modules: [
      m("m1", "Read Two", "Read two integers. Return 1 on success.", "Coder 1"),
      m("m2", "Swap", "Exchange the values pointed to by a and b.", "Coder 2"),
      m("m3", "Print Pair", "Print two integers separated by a space and a newline.", "Coder 3"),
      m("m4", "Report Swapped", "Print the already-swapped pair using print_pair.", "Coder 4"),
    ],
    template: String.raw`#include <stdio.h>

int read_two(int *a, int *b);
void swap(int *a, int *b);
void print_pair(int a, int b);
void report(int a, int b);

int main(void) {
    int a, b;
    if (!read_two(&a, &b)) { printf("Error\n"); return 0; }
    swap(&a, &b);
    report(a, b);
    return 0;
}

/*<m1>*/
int read_two(int *a, int *b) {
    /* MODULE 1 (Coder 1): read two integers. Return 1 on success. */
    return 0;
}
/*</m1>*/

/*<m2>*/
void swap(int *a, int *b) {
    /* MODULE 2 (Coder 2): exchange *a and *b using a temporary. */
}
/*</m2>*/

/*<m3>*/
void print_pair(int a, int b) {
    /* MODULE 3 (Coder 3): print "a b" followed by a newline. */
}
/*</m3>*/

/*<m4>*/
void report(int a, int b) {
    /* MODULE 4 (Coder 4): print the swapped pair using print_pair(a, b). */
}
/*</m4>*/
`,
    publicTests: [
      { name: "Sample 1", input: "10 20\n", expectedOutput: "20 10" },
      { name: "Sample 2", input: "5 8\n", expectedOutput: "8 5" },
    ],
    hiddenTests: [{ name: "Hidden 1", input: "-3 7\n", expectedOutput: "7 -3" }],
  },
];

export type { ProblemSeed, TestCase };
