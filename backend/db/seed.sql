-- ============================================================
-- CodeMeet seed data — 10 classic DSA problems
-- Each starter_code template reads from stdin so Judge0 can
-- execute it directly with the matching test_case input.
--
-- Escape rules used in this file (standard SQL strings, no E''):
--   actual newline in template  →  \n   (JSON interprets as newline)
--   literal \n in code text     →  \\n  (JSON interprets as backslash+n)
--   double quote in code text   →  \"   (JSON interprets as ")
--   single quote in SQL string  →  ''
-- ============================================================

-- Wipe existing data so the script is safe to re-run
TRUNCATE TABLE problems RESTART IDENTITY CASCADE;


-- ── 1. Two Sum ───────────────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Two Sum',
  'Easy',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
  '[
    {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] == 9, so return [0, 1]."},
    {"input": "nums = [3,2,4], target = 6",     "output": "[1,2]"},
    {"input": "nums = [3,3],   target = 6",     "output": "[0,1]"}
  ]'::jsonb,
  '["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."]'::jsonb,
  '[
    {"input": "2 7 11 15\n9", "output": "0 1"},
    {"input": "3 2 4\n6",     "output": "1 2"},
    {"input": "3 3\n6",       "output": "0 1"}
  ]'::jsonb,
  '{
    "python":     "def twoSum(nums, target):\n    pass\n\nnums = list(map(int, input().split()))\ntarget = int(input())\nprint(*twoSum(nums, target))",
    "javascript": "function twoSum(nums, target) {\n    \n}\n\nconst lines = require(\"fs\").readFileSync(0, \"utf8\").trim().split(\"\\n\");\nconst nums = lines[0].split(\" \").map(Number);\nconst target = Number(lines[1]);\nconsole.log(twoSum(nums, target).join(\" \"));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        int target = Integer.parseInt(sc.nextLine().trim());\n        int[] r = twoSum(nums, target);\n        System.out.println(r[0] + \" \" + r[1]);\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}\n\nint main() {\n    string line; getline(cin, line);\n    istringstream iss(line); vector<int> nums; int n;\n    while (iss >> n) nums.push_back(n);\n    int target; cin >> target;\n    auto r = twoSum(nums, target);\n    cout << r[0] << \" \" << r[1] << endl;\n}"
  }'::jsonb
);


-- ── 2. Valid Parentheses ─────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Valid Parentheses',
  'Easy',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: open brackets are closed by the same type of brackets, open brackets are closed in the correct order, and every close bracket has a corresponding open bracket.',
  '[
    {"input": "s = \"()\"",     "output": "true",  "explanation": "The brackets match."},
    {"input": "s = \"()[]{\"}", "output": "false", "explanation": "Unmatched open brace."},
    {"input": "s = \"(]\"",     "output": "false"}
  ]'::jsonb,
  '["1 <= s.length <= 10^4", "s consists of parentheses only ''()[]{}''."]'::jsonb,
  '[
    {"input": "()",     "output": "true"},
    {"input": "()[]{}", "output": "true"},
    {"input": "(]",     "output": "false"},
    {"input": "([)]",   "output": "false"},
    {"input": "{[]}",   "output": "true"}
  ]'::jsonb,
  '{
    "python":     "def isValid(s):\n    pass\n\ns = input().strip()\nprint(str(isValid(s)).lower())",
    "javascript": "function isValid(s) {\n    \n}\n\nconst s = require(\"fs\").readFileSync(0, \"utf8\").trim();\nconsole.log(String(isValid(s)).toLowerCase());",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static boolean isValid(String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isValid(sc.nextLine().trim()));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nbool isValid(string s) {\n    return false;\n}\n\nint main() {\n    string s; cin >> s;\n    cout << (isValid(s) ? \"true\" : \"false\") << endl;\n}"
  }'::jsonb
);


-- ── 3. Reverse Linked List ───────────────────────────────────────────────────
-- Represented as space-separated integers (array form) for stdin/stdout.
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Reverse Linked List',
  'Easy',
  'Given the head of a singly linked list, reverse the list, and return the reversed list. The list is represented as space-separated integers for this problem.',
  '[
    {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"},
    {"input": "head = [1,2]",       "output": "[2,1]"},
    {"input": "head = []",          "output": "[]"}
  ]'::jsonb,
  '["The number of nodes in the list is in the range [0, 5000].", "-5000 <= Node.val <= 5000"]'::jsonb,
  '[
    {"input": "1 2 3 4 5", "output": "5 4 3 2 1"},
    {"input": "1 2",       "output": "2 1"},
    {"input": "1",         "output": "1"}
  ]'::jsonb,
  '{
    "python":     "def reverseList(vals):\n    return vals[::-1]\n\nline = input().strip()\nif line:\n    vals = list(map(int, line.split()))\n    print(*reverseList(vals))",
    "javascript": "function reverseList(vals) {\n    return vals.slice().reverse();\n}\n\nconst line = require(\"fs\").readFileSync(0, \"utf8\").trim();\nif (line) console.log(reverseList(line.split(\" \").map(Number)).join(\" \"));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int[] reverseList(int[] vals) {\n        for (int i = 0, j = vals.length-1; i < j; i++, j--) {\n            int t = vals[i]; vals[i] = vals[j]; vals[j] = t;\n        }\n        return vals;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine().trim();\n        if (line.isEmpty()) return;\n        int[] vals = Arrays.stream(line.split(\" \")).mapToInt(Integer::parseInt).toArray();\n        System.out.println(Arrays.stream(reverseList(vals)).mapToObj(String::valueOf).reduce((a,b)->a+\" \"+b).orElse(\"\"));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string line; getline(cin, line);\n    if (line.empty()) return 0;\n    istringstream iss(line); vector<int> v; int n;\n    while (iss >> n) v.push_back(n);\n    reverse(v.begin(), v.end());\n    for (int i = 0; i < (int)v.size(); i++) {\n        if (i) cout << \" \";\n        cout << v[i];\n    }\n    cout << endl;\n}"
  }'::jsonb
);


-- ── 4. Maximum Subarray ──────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Maximum Subarray',
  'Medium',
  'Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.',
  '[
    {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6",  "explanation": "The subarray [4,-1,2,1] has the largest sum 6."},
    {"input": "nums = [1]",                      "output": "1"},
    {"input": "nums = [5,4,-1,7,8]",             "output": "23"}
  ]'::jsonb,
  '["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"]'::jsonb,
  '[
    {"input": "-2 1 -3 4 -1 2 1 -5 4", "output": "6"},
    {"input": "1",                      "output": "1"},
    {"input": "5 4 -1 7 8",            "output": "23"},
    {"input": "-1 -2 -3",              "output": "-1"}
  ]'::jsonb,
  '{
    "python":     "def maxSubArray(nums):\n    pass\n\nnums = list(map(int, input().split()))\nprint(maxSubArray(nums))",
    "javascript": "function maxSubArray(nums) {\n    \n}\n\nconst nums = require(\"fs\").readFileSync(0, \"utf8\").trim().split(\" \").map(Number);\nconsole.log(maxSubArray(nums));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int maxSubArray(int[] nums) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        System.out.println(maxSubArray(nums));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    string line; getline(cin, line);\n    istringstream iss(line); vector<int> nums; int n;\n    while (iss >> n) nums.push_back(n);\n    cout << maxSubArray(nums) << endl;\n}"
  }'::jsonb
);


-- ── 5. Climbing Stairs ───────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Climbing Stairs',
  'Easy',
  'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
  '[
    {"input": "n = 2", "output": "2", "explanation": "1+1 or 2 — two ways."},
    {"input": "n = 3", "output": "3", "explanation": "1+1+1, 1+2, or 2+1 — three ways."}
  ]'::jsonb,
  '["1 <= n <= 45"]'::jsonb,
  '[
    {"input": "2",  "output": "2"},
    {"input": "3",  "output": "3"},
    {"input": "5",  "output": "8"},
    {"input": "10", "output": "89"}
  ]'::jsonb,
  '{
    "python":     "def climbStairs(n):\n    pass\n\nn = int(input())\nprint(climbStairs(n))",
    "javascript": "function climbStairs(n) {\n    \n}\n\nconst n = parseInt(require(\"fs\").readFileSync(0, \"utf8\").trim());\nconsole.log(climbStairs(n));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int climbStairs(int n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(climbStairs(sc.nextInt()));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint climbStairs(int n) {\n    return 0;\n}\n\nint main() {\n    int n; cin >> n;\n    cout << climbStairs(n) << endl;\n}"
  }'::jsonb
);


-- ── 6. Best Time to Buy and Sell Stock ───────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Best Time to Buy and Sell Stock',
  'Easy',
  'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
  '[
    {"input": "prices = [7,1,5,3,6,4]", "output": "5",  "explanation": "Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 6-1 = 5."},
    {"input": "prices = [7,6,4,3,1]",   "output": "0",  "explanation": "No profit is possible."}
  ]'::jsonb,
  '["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"]'::jsonb,
  '[
    {"input": "7 1 5 3 6 4", "output": "5"},
    {"input": "7 6 4 3 1",   "output": "0"},
    {"input": "1 2",         "output": "1"},
    {"input": "2 4 1 7",     "output": "6"}
  ]'::jsonb,
  '{
    "python":     "def maxProfit(prices):\n    pass\n\nprices = list(map(int, input().split()))\nprint(maxProfit(prices))",
    "javascript": "function maxProfit(prices) {\n    \n}\n\nconst prices = require(\"fs\").readFileSync(0, \"utf8\").trim().split(\" \").map(Number);\nconsole.log(maxProfit(prices));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int maxProfit(int[] prices) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] prices = Arrays.stream(sc.nextLine().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        System.out.println(maxProfit(prices));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    return 0;\n}\n\nint main() {\n    string line; getline(cin, line);\n    istringstream iss(line); vector<int> p; int n;\n    while (iss >> n) p.push_back(n);\n    cout << maxProfit(p) << endl;\n}"
  }'::jsonb
);


-- ── 7. Palindrome Number ─────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Palindrome Number',
  'Easy',
  'Given an integer x, return true if x is a palindrome, and false otherwise. An integer is a palindrome when it reads the same forward and backward. For example, 121 is a palindrome while 123 is not.',
  '[
    {"input": "x = 121",  "output": "true",  "explanation": "121 reads as 121 from left to right and from right to left."},
    {"input": "x = -121", "output": "false", "explanation": "From left to right it reads -121. From right to left it reads 121-. Not a palindrome."},
    {"input": "x = 10",   "output": "false", "explanation": "Reads 01 from right to left."}
  ]'::jsonb,
  '["-2^31 <= x <= 2^31 - 1"]'::jsonb,
  '[
    {"input": "121",        "output": "true"},
    {"input": "-121",       "output": "false"},
    {"input": "10",         "output": "false"},
    {"input": "1221",       "output": "true"},
    {"input": "0",          "output": "true"}
  ]'::jsonb,
  '{
    "python":     "def isPalindrome(x):\n    pass\n\nx = int(input())\nprint(str(isPalindrome(x)).lower())",
    "javascript": "function isPalindrome(x) {\n    \n}\n\nconst x = parseInt(require(\"fs\").readFileSync(0, \"utf8\").trim());\nconsole.log(String(isPalindrome(x)).toLowerCase());",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static boolean isPalindrome(int x) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isPalindrome(sc.nextInt()));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPalindrome(int x) {\n    return false;\n}\n\nint main() {\n    int x; cin >> x;\n    cout << (isPalindrome(x) ? \"true\" : \"false\") << endl;\n}"
  }'::jsonb
);


-- ── 8. Merge Two Sorted Lists ────────────────────────────────────────────────
-- Lists are given as two space-separated lines.
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Merge Two Sorted Lists',
  'Easy',
  'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list. For this problem the lists are represented as space-separated integers.',
  '[
    {"input": "list1 = [1,2,4], list2 = [1,3,4]", "output": "[1,1,2,3,4,4]"},
    {"input": "list1 = [],      list2 = []",        "output": "[]"},
    {"input": "list1 = [],      list2 = [0]",       "output": "[0]"}
  ]'::jsonb,
  '["The number of nodes in both lists is in the range [0, 50].", "-100 <= Node.val <= 100", "Both list1 and list2 are sorted in non-decreasing order."]'::jsonb,
  '[
    {"input": "1 2 4\n1 3 4", "output": "1 1 2 3 4 4"},
    {"input": "5\n1 3 4",     "output": "1 3 4 5"},
    {"input": "2 6 8\n1 3 7", "output": "1 2 3 6 7 8"}
  ]'::jsonb,
  '{
    "python":     "def mergeLists(l1, l2):\n    return sorted(l1 + l2)\n\nimport sys\nlines = sys.stdin.read().split(\"\\n\")\nl1 = list(map(int, lines[0].split())) if lines[0].strip() else []\nl2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []\nresult = mergeLists(l1, l2)\nprint(*result)",
    "javascript": "function mergeLists(l1, l2) {\n    return [...l1, ...l2].sort((a, b) => a - b);\n}\n\nconst lines = require(\"fs\").readFileSync(0, \"utf8\").trim().split(\"\\n\");\nconst l1 = lines[0].trim() ? lines[0].trim().split(\" \").map(Number) : [];\nconst l2 = lines[1] && lines[1].trim() ? lines[1].trim().split(\" \").map(Number) : [];\nconsole.log(mergeLists(l1, l2).join(\" \"));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static List<Integer> mergeLists(int[] l1, int[] l2) {\n        List<Integer> merged = new ArrayList<>();\n        for (int v : l1) merged.add(v);\n        for (int v : l2) merged.add(v);\n        Collections.sort(merged);\n        return merged;\n    }\n\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        String line1 = sc.hasNextLine() ? sc.nextLine().trim() : \"\";\n        String line2 = sc.hasNextLine() ? sc.nextLine().trim() : \"\";\n        int[] l1 = line1.isEmpty() ? new int[0] : Arrays.stream(line1.split(\" \")).mapToInt(Integer::parseInt).toArray();\n        int[] l2 = line2.isEmpty() ? new int[0] : Arrays.stream(line2.split(\" \")).mapToInt(Integer::parseInt).toArray();\n        List<Integer> r = mergeLists(l1, l2);\n        System.out.println(r.stream().map(String::valueOf).reduce((a,b)->a+\" \"+b).orElse(\"\"));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string line1, line2;\n    getline(cin, line1); getline(cin, line2);\n    vector<int> v;\n    auto parse = [&](string& s) {\n        istringstream iss(s); int n;\n        while (iss >> n) v.push_back(n);\n    };\n    parse(line1); parse(line2);\n    sort(v.begin(), v.end());\n    for (int i = 0; i < (int)v.size(); i++) {\n        if (i) cout << \" \";\n        cout << v[i];\n    }\n    cout << endl;\n}"
  }'::jsonb
);


-- ── 9. Contains Duplicate ────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Contains Duplicate',
  'Easy',
  'Given an integer array nums, return true if any value appears at least twice in the array, and false if every element is distinct.',
  '[
    {"input": "nums = [1,2,3,1]",           "output": "true"},
    {"input": "nums = [1,2,3,4]",           "output": "false"},
    {"input": "nums = [1,1,1,3,3,4,3,2,4,2]","output": "true"}
  ]'::jsonb,
  '["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"]'::jsonb,
  '[
    {"input": "1 2 3 1",             "output": "true"},
    {"input": "1 2 3 4",             "output": "false"},
    {"input": "1 1 1 3 3 4 3 2 4 2","output": "true"},
    {"input": "7",                   "output": "false"}
  ]'::jsonb,
  '{
    "python":     "def containsDuplicate(nums):\n    pass\n\nnums = list(map(int, input().split()))\nprint(str(containsDuplicate(nums)).lower())",
    "javascript": "function containsDuplicate(nums) {\n    \n}\n\nconst nums = require(\"fs\").readFileSync(0, \"utf8\").trim().split(\" \").map(Number);\nconsole.log(String(containsDuplicate(nums)).toLowerCase());",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        System.out.println(containsDuplicate(nums));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    return false;\n}\n\nint main() {\n    string line; getline(cin, line);\n    istringstream iss(line); vector<int> nums; int n;\n    while (iss >> n) nums.push_back(n);\n    cout << (containsDuplicate(nums) ? \"true\" : \"false\") << endl;\n}"
  }'::jsonb
);


-- ── 10. Roman to Integer ─────────────────────────────────────────────────────
INSERT INTO problems (title, difficulty, description, examples, constraints, test_cases, starter_code)
VALUES (
  'Roman to Integer',
  'Easy',
  'Roman numerals are represented by seven different symbols: I(1), V(5), X(10), L(50), C(100), D(500), M(1000). Given a roman numeral, convert it to an integer. Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not IIII but IV, because the one is before the five we subtract it making four. There are six instances where subtraction is used: IV(4), IX(9), XL(40), XC(90), CD(400) and CM(900).',
  '[
    {"input": "s = \"III\"",     "output": "3",    "explanation": "III = 3."},
    {"input": "s = \"LVIII\"",   "output": "58",   "explanation": "L=50, V=5, III=3."},
    {"input": "s = \"MCMXCIV\"", "output": "1994", "explanation": "M=1000, CM=900, XC=90, IV=4."}
  ]'::jsonb,
  '["1 <= s.length <= 15", "s contains only the characters (''I'', ''V'', ''X'', ''L'', ''C'', ''D'', ''M'').", "It is guaranteed that s is a valid roman numeral in the range [1, 3999]."]'::jsonb,
  '[
    {"input": "III",     "output": "3"},
    {"input": "LVIII",   "output": "58"},
    {"input": "MCMXCIV", "output": "1994"},
    {"input": "IV",      "output": "4"},
    {"input": "IX",      "output": "9"}
  ]'::jsonb,
  '{
    "python":     "def romanToInt(s):\n    pass\n\ns = input().strip()\nprint(romanToInt(s))",
    "javascript": "function romanToInt(s) {\n    \n}\n\nconst s = require(\"fs\").readFileSync(0, \"utf8\").trim();\nconsole.log(romanToInt(s));",
    "java":       "import java.util.*;\n\npublic class Main {\n    public static int romanToInt(String s) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(romanToInt(sc.nextLine().trim()));\n    }\n}",
    "cpp":        "#include <bits/stdc++.h>\nusing namespace std;\n\nint romanToInt(string s) {\n    return 0;\n}\n\nint main() {\n    string s; cin >> s;\n    cout << romanToInt(s) << endl;\n}"
  }'::jsonb
);
