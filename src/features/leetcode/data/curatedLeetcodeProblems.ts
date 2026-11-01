import { LeetCodeProblem } from '../types/leetcode.types';

export const CURATED_LEETCODE_PROBLEMS: LeetCodeProblem[] = [
  // 1. Two Sum
  {
    id: '1',
    frontendQuestionId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    topicTags: ['Array', 'Hash Table'],
    paidOnly: false,
    acceptanceRate: 53.6,
    url: 'https://leetcode.com/problems/two-sum/',
    source: 'curated_catalog',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Can you think of an O(N) or O(N log N) approach?',
      'If you fix the first number x = nums[i], what exact number are you looking for to reach target?',
      'You are looking for complement = target - nums[i]. What data structure provides O(1) average lookup time for previously seen values?',
      'Iterate through the array while maintaining a Hash Map mapping value -> index. For each number, check if complement is already in the map.',
      'Pseudocode:\nmap = {}\nfor i, num in enumerate(nums):\n  comp = target - num\n  if comp in map: return [map[comp], i]\n  map[num] = i',
    ],
    starterCode: {
      cpp20: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
    },
  },

  // 2. Add Two Numbers
  {
    id: '2',
    frontendQuestionId: '2',
    title: 'Add Two Numbers',
    titleSlug: 'add-two-numbers',
    difficulty: 'Medium',
    topicTags: ['Linked List', 'Math', 'Recursion'],
    paidOnly: false,
    acceptanceRate: 43.1,
    url: 'https://leetcode.com/problems/add-two-numbers/',
    source: 'curated_catalog',
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    constraints: [
      'The number of nodes in each linked list is in the range [1, 100].',
      '0 <= Node.val <= 9',
      'It is guaranteed that the list represents a number that does not have leading zeros.',
    ],
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.',
      },
      {
        input: 'l1 = [0], l2 = [0]',
        output: '[0]',
      },
      {
        input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
        output: '[8,9,9,9,0,0,0,1]',
      },
    ],
    hints: [
      'Notice that digits are already stored in reverse order. What is the standard grade-school addition method for column by column digits?',
      'Keep track of a carry value across additions. What happens when sum >= 10?',
      'Create a dummy head node to simplify list assembly.',
      'Loop while l1 is not null, l2 is not null, OR carry > 0.',
      'In each step: val = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry. carry = val // 10. newNode(val % 10).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy(0);
        ListNode* curr = &dummy;
        int carry = 0;
        while (l1 || l2 || carry) {
            int sum = carry + (l1 ? l1->val : 0) + (l2 ? l2->val : 0);
            carry = sum / 10;
            curr->next = new ListNode(sum % 10);
            curr = curr->next;
            if (l1) l1 = l1->next;
            if (l2) l2 = l2->next;
        }
        return dummy.next;
    }
};`,
      python: `class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        carry = 0
        while l1 or l2 or carry:
            val = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
            carry = val // 10
            curr.next = ListNode(val % 10)
            curr = curr.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next`,
      java: `class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry != 0) {
            int sum = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
            carry = sum / 10;
            curr.next = new ListNode(sum % 10);
            curr = curr.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}`,
      javascript: `var addTwoNumbers = function(l1, l2) {
    const dummy = new ListNode(0);
    let curr = dummy;
    let carry = 0;
    while (l1 !== null || l2 !== null || carry !== 0) {
        const sum = carry + (l1 ? l1.val : 0) + (l2 ? l2.val : 0);
        carry = Math.floor(sum / 10);
        curr.next = new ListNode(sum % 10);
        curr = curr.next;
        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }
    return dummy.next;
};`,
    },
  },

  // 3. Longest Substring Without Repeating Characters
  {
    id: '3',
    frontendQuestionId: '3',
    title: 'Longest Substring Without Repeating Characters',
    titleSlug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    topicTags: ['Hash Table', 'String', 'Sliding Window'],
    paidOnly: false,
    acceptanceRate: 35.8,
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    source: 'curated_catalog',
    description: `Given a string \`s\`, find the length of the longest substring without duplicate characters.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence and not a substring.',
      },
    ],
    hints: [
      'Can you maintain a window [left, right] of characters without duplicates?',
      'When you encounter a character s[right] that already exists in the window, what must you do to the left boundary?',
      'Advance the left pointer until the duplicate character is removed from the window.',
      'Alternatively, store the last seen index of each character to jump left pointer directly in O(1).',
      'Track maxLen = max(maxLen, right - left + 1) at each expansion step.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> lastPos(256, -1);
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); ++right) {
            if (lastPos[(unsigned char)s[right]] >= left) {
                left = lastPos[(unsigned char)s[right]] + 1;
            }
            lastPos[(unsigned char)s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last_pos = {}
        max_len = 0
        left = 0
        for right, char in enumerate(s):
            if char in last_pos and last_pos[char] >= left:
                left = last_pos[char] + 1
            last_pos[char] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastPos = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastPos.containsKey(c) && lastPos.get(c) >= left) {
                left = lastPos.get(c) + 1;
            }
            lastPos.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      javascript: `var lengthOfLongestSubstring = function(s) {
    const lastPos = new Map();
    let maxLen = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (lastPos.has(c) && lastPos.get(c) >= left) {
            left = lastPos.get(c) + 1;
        }
        lastPos.set(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};`,
    },
  },

  // 4. Median of Two Sorted Arrays
  {
    id: '4',
    frontendQuestionId: '4',
    title: 'Median of Two Sorted Arrays',
    titleSlug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    topicTags: ['Array', 'Binary Search', 'Divide and Conquer'],
    paidOnly: false,
    acceptanceRate: 40.5,
    url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    source: 'curated_catalog',
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.`,
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '1 <= m + n <= 2000',
      '-10^6 <= nums1[i], nums2[i] <= 10^6',
    ],
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.',
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
      },
    ],
    hints: [
      'The median divides the combined set of elements into two halves of equal length.',
      'Binary search on the smaller array so the search range is at most O(log min(m, n)).',
      'Partition nums1 at index i and nums2 at index j such that i + j = (m + n + 1) // 2.',
      'Check if nums1[i-1] <= nums2[j] and nums2[j-1] <= nums1[i]. If not, shift the partition left or right.',
      'Handle edge bounds carefully using INT_MIN and INT_MAX when partitions are empty.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.size(), n = nums2.size();
        int low = 0, high = m;
        while (low <= high) {
            int partition1 = (low + high) / 2;
            int partition2 = (m + n + 1) / 2 - partition1;
            int maxLeft1 = (partition1 == 0) ? INT_MIN : nums1[partition1 - 1];
            int minRight1 = (partition1 == m) ? INT_MAX : nums1[partition1];
            int maxLeft2 = (partition2 == 0) ? INT_MIN : nums2[partition2 - 1];
            int minRight2 = (partition2 == n) ? INT_MAX : nums2[partition2];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 0) {
                    return (max(maxLeft1, maxLeft2) + min(minRight1, minRight2)) / 2.0;
                } else {
                    return max(maxLeft1, maxLeft2);
                }
            } else if (maxLeft1 > minRight2) {
                high = partition1 - 1;
            } else {
                low = partition1 + 1;
            }
        }
        return 0.0;
    }
};`,
      python: `class Solution:
    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        low, high = 0, m
        while low <= high:
            i = (low + high) // 2
            j = (m + n + 1) // 2 - i
            left1 = nums1[i - 1] if i > 0 else float('-inf')
            right1 = nums1[i] if i < m else float('inf')
            left2 = nums2[j - 1] if j > 0 else float('-inf')
            right2 = nums2[j] if j < n else float('inf')

            if left1 <= right2 and left2 <= right1:
                if (m + n) % 2 == 0:
                    return (max(left1, left2) + min(right1, right2)) / 2.0
                return max(left1, left2)
            elif left1 > right2:
                high = i - 1
            else:
                low = i + 1
        return 0.0`,
      java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.length, n = nums2.length;
        int low = 0, high = m;
        while (low <= high) {
            int p1 = (low + high) / 2;
            int p2 = (m + n + 1) / 2 - p1;
            int maxLeft1 = (p1 == 0) ? Integer.MIN_VALUE : nums1[p1 - 1];
            int minRight1 = (p1 == m) ? Integer.MAX_VALUE : nums1[p1];
            int maxLeft2 = (p2 == 0) ? Integer.MIN_VALUE : nums2[p2 - 1];
            int minRight2 = (p2 == n) ? Integer.MAX_VALUE : nums2[p2];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 0) {
                    return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0;
                }
                return Math.max(maxLeft1, maxLeft2);
            } else if (maxLeft1 > minRight2) {
                high = p1 - 1;
            } else {
                low = p1 + 1;
            }
        }
        return 0.0;
    }
}`,
      javascript: `var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
    const m = nums1.length, n = nums2.length;
    let low = 0, high = m;
    while (low <= high) {
        const p1 = Math.floor((low + high) / 2);
        const p2 = Math.floor((m + n + 1) / 2) - p1;
        const maxLeft1 = p1 === 0 ? -Infinity : nums1[p1 - 1];
        const minRight1 = p1 === m ? Infinity : nums1[p1];
        const maxLeft2 = p2 === 0 ? -Infinity : nums2[p2 - 1];
        const minRight2 = p2 === n ? Infinity : nums2[p2];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            if ((m + n) % 2 === 0) {
                return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2;
            }
            return Math.max(maxLeft1, maxLeft2);
        } else if (maxLeft1 > minRight2) {
            high = p1 - 1;
        } else {
            low = p1 + 1;
        }
    }
    return 0;
};`,
    },
  },

  // 5. Longest Palindromic Substring
  {
    id: '5',
    frontendQuestionId: '5',
    title: 'Longest Palindromic Substring',
    titleSlug: 'longest-palindromic-substring',
    difficulty: 'Medium',
    topicTags: ['Two Pointers', 'String', 'Dynamic Programming'],
    paidOnly: false,
    acceptanceRate: 34.2,
    url: 'https://leetcode.com/problems/longest-palindromic-substring/',
    source: 'curated_catalog',
    description: `Given a string \`s\`, return the longest palindromic substring in \`s\`.`,
    constraints: ['1 <= s.length <= 1000', 's consist of only digits and English letters.'],
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    hints: [
      'How many possible centers can a palindrome have?',
      'A palindrome can be centered on an odd character (single letter) or an even center (between two letters). Total 2N - 1 centers.',
      'For each center, expand outwards as long as s[left] == s[right].',
      'Keep track of the start index and max length seen so far.',
      'Time complexity is O(N^2) and space complexity is O(1).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    string longestPalindrome(string s) {
        int start = 0, maxLen = 0;
        auto expand = [&](int l, int r) {
            while (l >= 0 && r < s.length() && s[l] == s[r]) {
                if (r - l + 1 > maxLen) {
                    start = l;
                    maxLen = r - l + 1;
                }
                --l; ++r;
            }
        };
        for (int i = 0; i < s.length(); ++i) {
            expand(i, i);
            expand(i, i + 1);
        }
        return s.substr(start, maxLen);
    }
};`,
      python: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        start, max_len = 0, 0
        def expand(l, r):
            nonlocal start, max_len
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > max_len:
                    start = l
                    max_len = r - l + 1
                l -= 1
                r += 1
        for i in range(len(s)):
            expand(i, i)
            expand(i, i + 1)
        return s[start:start + max_len]`,
      java: `class Solution {
    private int start = 0, maxLen = 0;
    public String longestPalindrome(String s) {
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substring(start, start + maxLen);
    }
    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            if (r - l + 1 > maxLen) {
                start = l;
                maxLen = r - l + 1;
            }
            l--; r++;
        }
    }
}`,
      javascript: `var longestPalindrome = function(s) {
    let start = 0, maxLen = 0;
    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) {
            if (r - l + 1 > maxLen) {
                start = l;
                maxLen = r - l + 1;
            }
            l--; r++;
        }
    };
    for (let i = 0; i < s.length; i++) {
        expand(i, i);
        expand(i, i + 1);
    }
    return s.slice(start, start + maxLen);
};`,
    },
  },

  // 11. Container With Most Water
  {
    id: '11',
    frontendQuestionId: '11',
    title: 'Container With Most Water',
    titleSlug: 'container-with-most-water',
    difficulty: 'Medium',
    topicTags: ['Array', 'Two Pointers', 'Greedy'],
    paidOnly: false,
    acceptanceRate: 55.4,
    url: 'https://leetcode.com/problems/container-with-most-water/',
    source: 'curated_catalog',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.`,
    constraints: ['n == height.length', '2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.',
      },
      { input: 'height = [1,1]', output: '1' },
    ],
    hints: [
      'The area is determined by width * min(height[left], height[right]).',
      'Start with the widest container: left = 0 and right = n - 1.',
      'Which pointer should you move inwards to potentially find a larger area?',
      'Moving the taller pointer cannot increase the area because width decreases and min height is capped by the shorter line. So always move the shorter pointer!',
      'Continue until left >= right in O(N) time.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1, best = 0;
        while (l < r) {
            best = max(best, (r - l) * min(height[l], height[r]));
            if (height[l] < height[r]) ++l;
            else --r;
        }
        return best;
    }
};`,
      python: `class Solution:
    def maxArea(self, height: list[int]) -> int:
        l, r, best = 0, len(height) - 1, 0
        while l < r:
            best = max(best, (r - l) * min(height[l], height[r]))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return best`,
      java: `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            best = Math.max(best, (r - l) * Math.min(height[l], height[r]));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
}`,
      javascript: `var maxArea = function(height) {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
        best = Math.max(best, (r - l) * Math.min(height[l], height[r]));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return best;
};`,
    },
  },

  // 15. 3Sum
  {
    id: '15',
    frontendQuestionId: '15',
    title: '3Sum',
    titleSlug: '3sum',
    difficulty: 'Medium',
    topicTags: ['Array', 'Two Pointers', 'Sorting'],
    paidOnly: false,
    acceptanceRate: 34.9,
    url: 'https://leetcode.com/problems/3sum/',
    source: 'curated_catalog',
    description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. The distinct triplets are [-1,0,1] and [-1,-1,2].',
      },
      { input: 'nums = [0,1,1]', output: '[]' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]' },
    ],
    hints: [
      'Sorting the array first makes deduplication and two-pointer navigation straightforward.',
      'Fix the first element nums[i]. What must the remaining two elements sum to?',
      'Use two pointers (left = i + 1, right = n - 1) on the remaining sorted subsegment.',
      'How to avoid duplicate triplets? Skip adjacent duplicate values for i, left, and right.',
      'Time complexity is O(N^2) with O(1) extra space outside the output.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        int n = nums.size();
        for (int i = 0; i < n - 2; ++i) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l + 1]) ++l;
                    while (l < r && nums[r] == nums[r - 1]) --r;
                    ++l; --r;
                } else if (sum < 0) {
                    ++l;
                } else {
                    --r;
                }
            }
        }
        return res;
    }
};`,
      python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        n = len(nums)
        for i in range(n - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, n - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]:
                        l += 1
                    while l < r and nums[r] == nums[r - 1]:
                        r -= 1
                    l += 1
                    r -= 1
                elif s < 0:
                    l += 1
                else:
                    r -= 1
        return res`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (sum < 0) {
                    l++;
                } else {
                    r--;
                }
            }
        }
        return res;
    }
}`,
      javascript: `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    const n = nums.length;
    for (let i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = n - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) {
                l++;
            } else {
                r--;
            }
        }
    }
    return res;
};`,
    },
  },

  // 20. Valid Parentheses
  {
    id: '20',
    frontendQuestionId: '20',
    title: 'Valid Parentheses',
    titleSlug: 'valid-parentheses',
    difficulty: 'Easy',
    topicTags: ['String', 'Stack'],
    paidOnly: false,
    acceptanceRate: 41.2,
    url: 'https://leetcode.com/problems/valid-parentheses/',
    source: 'curated_catalog',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
      { input: 's = "([])"', output: 'true' },
    ],
    hints: [
      'A Last-In-First-Out (LIFO) stack data structure is ideal for matching brackets.',
      'When you see an opening bracket, push it onto the stack.',
      'When you see a closing bracket, check if the stack is non-empty and the top matches.',
      'At the end of the string, what must the stack state be? It must be completely empty.',
      'Time complexity is O(N) and space complexity is O(N).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                char top = st.top(); st.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return st.empty();
    }
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        matching = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in matching:
                if not stack or stack[-1] != matching[char]:
                    return False
                stack.pop()
            else:
                stack.append(char)
        return len(stack) == 0`,
      java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      javascript: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (c in map) {
            if (!stack.length || stack.pop() !== map[c]) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.length === 0;
};`,
    },
  },

  // 21. Merge Two Sorted Lists
  {
    id: '21',
    frontendQuestionId: '21',
    title: 'Merge Two Sorted Lists',
    titleSlug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    topicTags: ['Linked List', 'Recursion'],
    paidOnly: false,
    acceptanceRate: 64.7,
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    source: 'curated_catalog',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.',
    ],
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]',
      },
      { input: 'list1 = [], list2 = []', output: '[]' },
      { input: 'list1 = [], list2 = [0]', output: '[0]' },
    ],
    hints: [
      'Use a dummy node to anchor the result head and a tail pointer to append the smaller node.',
      'Compare list1.val and list2.val at each step and attach the smaller one.',
      'Once one list is exhausted, directly link the remainder of the other list.',
      'Time complexity is O(N + M) and space complexity is O(1).',
      'Can also be cleanly written recursively: if (!l1) return l2; if (!l2) return l1; ...',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`,
      python: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        tail = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 or list2
        return dummy.next`,
      java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                tail.next = list1;
                list1 = list1.next;
            } else {
                tail.next = list2;
                list2 = list2.next;
            }
            tail = tail.next;
        }
        tail.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}`,
      javascript: `var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (list1 && list2) {
        if (list1.val <= list2.val) {
            tail.next = list1;
            list1 = list1.next;
        } else {
            tail.next = list2;
            list2 = list2.next;
        }
        tail = tail.next;
    }
    tail.next = list1 || list2;
    return dummy.next;
};`,
    },
  },

  // 42. Trapping Rain Water
  {
    id: '42',
    frontendQuestionId: '42',
    title: 'Trapping Rain Water',
    titleSlug: 'trapping-rain-water',
    difficulty: 'Hard',
    topicTags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
    paidOnly: false,
    acceptanceRate: 62.3,
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    source: 'curated_catalog',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
      },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    hints: [
      'Water above bar i is given by max(0, min(maxLeft[i], maxRight[i]) - height[i]).',
      'Can you compute this in O(1) space using two pointers?',
      'Maintain left = 0, right = n - 1, and maxLeft, maxRight.',
      'If maxLeft <= maxRight, water trapped at left is determined strictly by maxLeft because right has a bound >= maxLeft.',
      'Increment left or decrement right accordingly in O(N) time and O(1) space.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = height.size() - 1;
        int maxL = 0, maxR = 0, water = 0;
        while (l < r) {
            if (height[l] <= height[r]) {
                if (height[l] >= maxL) maxL = height[l];
                else water += maxL - height[l];
                ++l;
            } else {
                if (height[r] >= maxR) maxR = height[r];
                else water += maxR - height[r];
                --r;
            }
        }
        return water;
    }
};`,
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        l, r = 0, len(height) - 1
        max_l, max_r, water = 0, 0, 0
        while l < r:
            if height[l] <= height[r]:
                if height[l] >= max_l:
                    max_l = height[l]
                else:
                    water += max_l - height[l]
                l += 1
            else:
                if height[r] >= max_r:
                    max_r = height[r]
                else:
                    water += max_r - height[r]
                r -= 1
        return water`,
      java: `class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1;
        int maxL = 0, maxR = 0, water = 0;
        while (l < r) {
            if (height[l] <= height[r]) {
                if (height[l] >= maxL) maxL = height[l];
                else water += maxL - height[l];
                l++;
            } else {
                if (height[r] >= maxR) maxR = height[r];
                else water += maxR - height[r];
                r--;
            }
        }
        return water;
    }
}`,
      javascript: `var trap = function(height) {
    let l = 0, r = height.length - 1;
    let maxL = 0, maxR = 0, water = 0;
    while (l < r) {
        if (height[l] <= height[r]) {
            if (height[l] >= maxL) maxL = height[l];
            else water += maxL - height[l];
            l++;
        } else {
            if (height[r] >= maxR) maxR = height[r];
            else water += maxR - height[r];
            r--;
        }
    }
    return water;
};`,
    },
  },

  // 53. Maximum Subarray (Kadane's Algorithm)
  {
    id: '53',
    frontendQuestionId: '53',
    title: 'Maximum Subarray',
    titleSlug: 'maximum-subarray',
    difficulty: 'Medium',
    topicTags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    paidOnly: false,
    acceptanceRate: 51.1,
    url: 'https://leetcode.com/problems/maximum-subarray/',
    source: 'curated_catalog',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    hints: [
      'If you have current sum < 0, does carrying it into future elements help or hurt?',
      'Reset the running sum to 0 whenever it drops below 0 (Kadane\'s Algorithm).',
      'curr = max(num, curr + num); max_sum = max(max_sum, curr).',
      'Time complexity is O(N) with O(1) space.',
      'A divide-and-conquer approach can also be used in O(N log N) using tree segment merges.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int best = nums[0], curr = 0;
        for (int x : nums) {
            curr = max(x, curr + x);
            best = max(best, curr);
        }
        return best;
    }
};`,
      python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        best = nums[0]
        curr = 0
        for x in nums:
            curr = max(x, curr + x)
            best = max(best, curr)
        return best`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], curr = 0;
        for (int x : nums) {
            curr = Math.max(x, curr + x);
            best = Math.max(best, curr);
        }
        return best;
    }
}`,
      javascript: `var maxSubArray = function(nums) {
    let best = nums[0], curr = 0;
    for (const x of nums) {
        curr = Math.max(x, curr + x);
        best = Math.max(best, curr);
    }
    return best;
};`,
    },
  },

  // 70. Climbing Stairs
  {
    id: '70',
    frontendQuestionId: '70',
    title: 'Climbing Stairs',
    titleSlug: 'climbing-stairs',
    difficulty: 'Easy',
    topicTags: ['Math', 'Dynamic Programming', 'Memoization'],
    paidOnly: false,
    acceptanceRate: 53.0,
    url: 'https://leetcode.com/problems/climbing-stairs/',
    source: 'curated_catalog',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    constraints: ['1 <= n <= 45'],
    examples: [
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps',
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways: 1. 1 step + 1 step + 1 step, 2. 1 step + 2 steps, 3. 2 steps + 1 step',
      },
    ],
    hints: [
      'To reach step n, you can either step from (n - 1) or from (n - 2).',
      'Therefore, ways(n) = ways(n - 1) + ways(n - 2).',
      'This matches the classic Fibonacci recurrence!',
      'Base cases: ways(1) = 1, ways(2) = 2.',
      'Can be computed iteratively in O(N) time and O(1) space.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; ++i) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
      java: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}`,
      javascript: `var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
};`,
    },
  },

  // 121. Best Time to Buy and Sell Stock
  {
    id: '121',
    frontendQuestionId: '121',
    title: 'Best Time to Buy and Sell Stock',
    titleSlug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    topicTags: ['Array', 'Dynamic Programming'],
    paidOnly: false,
    acceptanceRate: 54.8,
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    source: 'curated_catalog',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.',
      },
    ],
    hints: [
      'For each day i, what is the maximum profit if you sell on day i?',
      'It is prices[i] minus the minimum price seen so far before day i.',
      'Keep a running minPrice as you iterate through prices.',
      'Update maxProfit = max(maxProfit, prices[i] - minPrice).',
      'Time complexity is O(N) in a single pass with O(1) space.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, maxProfit = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxProfit = max(maxProfit, p - minPrice);
        }
        return maxProfit;
    }
};`,
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_p = float('inf')
        max_profit = 0
        for p in prices:
            min_p = min(min_p, p)
            max_profit = max(max_profit, p - min_p)
        return max_profit`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minP = Integer.MAX_VALUE, maxProfit = 0;
        for (int p : prices) {
            minP = Math.min(minP, p);
            maxProfit = Math.max(maxProfit, p - minP);
        }
        return maxProfit;
    }
}`,
      javascript: `var maxProfit = function(prices) {
    let minP = Infinity, maxProfit = 0;
    for (const p of prices) {
        minP = Math.min(minP, p);
        maxProfit = Math.max(maxProfit, p - minP);
    }
    return maxProfit;
};`,
    },
  },

  // 200. Number of Islands
  {
    id: '200',
    frontendQuestionId: '200',
    title: 'Number of Islands',
    titleSlug: 'number-of-islands',
    difficulty: 'Medium',
    topicTags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    paidOnly: false,
    acceptanceRate: 59.8,
    url: 'https://leetcode.com/problems/number-of-islands/',
    source: 'curated_catalog',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      'grid[i][j] is "0" or "1".',
    ],
    examples: [
      {
        input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
        output: '1',
      },
      {
        input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]',
        output: '3',
      },
    ],
    hints: [
      'Iterate through every cell in the grid.',
      'Whenever you find a cell with value "1", increment your island count.',
      'Trigger a DFS or BFS from that cell to "sink" (mark as "0" or visited) all connected land cells.',
      'Ensure you check grid boundaries (0 <= r < m, 0 <= c < n).',
      'Time complexity is O(M * N) and space complexity is O(M * N) recursion stack.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int m = grid.size(), n = grid[0].size(), count = 0;
        function<void(int, int)> dfs = [&](int r, int c) {
            if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1') return;
            grid[r][c] = '0';
            dfs(r + 1, c); dfs(r - 1, c);
            dfs(r, c + 1); dfs(r, c - 1);
        };
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == '1') {
                    ++count;
                    dfs(i, j);
                }
            }
        }
        return count;
    }
};`,
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid: return 0
        m, n = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c)
            dfs(r, c + 1); dfs(r, c - 1)
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1':
                    count += 1
                    dfs(i, j)
        return count`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        int m = grid.length, n = grid[0].length, count = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }
        return count;
    }
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c); dfs(grid, r - 1, c);
        dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
}`,
      javascript: `var numIslands = function(grid) {
    const m = grid.length, n = grid[0].length;
    let count = 0;
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c);
        dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
                count++;
                dfs(i, j);
            }
        }
    }
    return count;
};`,
    },
  },

  // 206. Reverse Linked List
  {
    id: '206',
    frontendQuestionId: '206',
    title: 'Reverse Linked List',
    titleSlug: 'reverse-linked-list',
    difficulty: 'Easy',
    topicTags: ['Linked List', 'Recursion'],
    paidOnly: false,
    acceptanceRate: 77.2,
    url: 'https://leetcode.com/problems/reverse-linked-list/',
    source: 'curated_catalog',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
      { input: 'head = []', output: '[]' },
    ],
    hints: [
      'Iterative approach: Maintain prev = null, curr = head.',
      'Save nextNode = curr.next before changing pointers.',
      'Reverse link: curr.next = prev.',
      'Move pointers forward: prev = curr; curr = nextNode.',
      'Return prev when curr becomes null.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};`,
      python: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}`,
      javascript: `var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
};`,
    },
  },

  // 217. Contains Duplicate
  {
    id: '217',
    frontendQuestionId: '217',
    title: 'Contains Duplicate',
    titleSlug: 'contains-duplicate',
    difficulty: 'Easy',
    topicTags: ['Array', 'Hash Table', 'Sorting'],
    paidOnly: false,
    acceptanceRate: 62.4,
    url: 'https://leetcode.com/problems/contains-duplicate/',
    source: 'curated_catalog',
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' },
    ],
    hints: [
      'What data structure allows checking for set membership in O(1) average time?',
      'Iterate through nums and insert each element into a hash set.',
      'If the element is already present in the set, return true.',
      'Alternatively, sort the array and look for adjacent duplicates in O(N log N) with O(1) space.',
      'Set approach takes O(N) time and O(N) space.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> s;
        for (int x : nums) {
            if (s.count(x)) return true;
            s.insert(x);
        }
        return false;
    }
};`,
      python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        return len(nums) != len(set(nums))`,
      java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> s = new HashSet<>();
        for (int x : nums) {
            if (!s.add(x)) return true;
        }
        return false;
    }
}`,
      javascript: `var containsDuplicate = function(nums) {
    return new Set(nums).size !== nums.length;
};`,
    },
  },

  // 226. Invert Binary Tree
  {
    id: '226',
    frontendQuestionId: '226',
    title: 'Invert Binary Tree',
    titleSlug: 'invert-binary-tree',
    difficulty: 'Easy',
    topicTags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    paidOnly: false,
    acceptanceRate: 77.8,
    url: 'https://leetcode.com/problems/invert-binary-tree/',
    source: 'curated_catalog',
    description: `Given the \`root\` of a binary tree, invert the tree, and return its root.`,
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' },
      { input: 'root = [2,1,3]', output: '[2,3,1]' },
      { input: 'root = []', output: '[]' },
    ],
    hints: [
      'Inverting a tree means swapping the left and right children of every node in the tree.',
      'Base case: If root is null, return null.',
      'Swap root.left and root.right.',
      'Recursively call invertTree on the children.',
      'Time complexity is O(N) where N is number of nodes.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        swap(root->left, root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};`,
      python: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root: return None
        root.left, root.right = root.right, root.left
        self.invertTree(root.left)
        self.invertTree(root.right)
        return root`,
      java: `class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode temp = root.left;
        root.left = root.right;
        root.right = temp;
        invertTree(root.left);
        invertTree(root.right);
        return root;
    }
}`,
      javascript: `var invertTree = function(root) {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    invertTree(root.left);
    invertTree(root.right);
    return root;
};`,
    },
  },

  // 242. Valid Anagram
  {
    id: '242',
    frontendQuestionId: '242',
    title: 'Valid Anagram',
    titleSlug: 'valid-anagram',
    difficulty: 'Easy',
    topicTags: ['Hash Table', 'String', 'Sorting'],
    paidOnly: false,
    acceptanceRate: 64.9,
    url: 'https://leetcode.com/problems/valid-anagram/',
    source: 'curated_catalog',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.',
    ],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    hints: [
      'First check: if s.length != t.length, they cannot be anagrams.',
      'Count frequency of each character in s and decrement for each in t.',
      'Can use a fixed array of size 26 for lowercase English letters.',
      'If any count is non-zero, return false.',
      'O(N) time and O(1) space since alphabet size is bounded.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        int counts[26] = {0};
        for (int i = 0; i < s.length(); ++i) {
            counts[s[i] - 'a']++;
            counts[t[i] - 'a']--;
        }
        for (int c : counts) if (c != 0) return false;
        return true;
    }
};`,
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t): return False
        from collections import Counter
        return Counter(s) == Counter(t)`,
      java: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
            counts[t.charAt(i) - 'a']--;
        }
        for (int c : counts) if (c != 0) return false;
        return true;
    }
}`,
      javascript: `var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    const counts = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) {
        counts[s.charCodeAt(i) - 97]++;
        counts[t.charCodeAt(i) - 97]--;
    }
    return counts.every(c => c === 0);
};`,
    },
  },

  // 300. Longest Increasing Subsequence
  {
    id: '300',
    frontendQuestionId: '300',
    title: 'Longest Increasing Subsequence',
    titleSlug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    topicTags: ['Array', 'Binary Search', 'Dynamic Programming'],
    paidOnly: false,
    acceptanceRate: 55.7,
    url: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    source: 'curated_catalog',
    description: `Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence.`,
    constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      {
        input: 'nums = [10,9,2,5,3,7,101,18]',
        output: '4',
        explanation: 'The longest increasing subsequence is [2,5,7,101], therefore the length is 4.',
      },
      { input: 'nums = [0,1,0,3,2,3]', output: '4' },
      { input: 'nums = [7,7,7,7,7,7,7]', output: '1' },
    ],
    hints: [
      'Standard DP: dp[i] = length of LIS ending at index i. dp[i] = 1 + max(dp[j]) for j < i and nums[j] < nums[i]. This takes O(N^2).',
      'Can you optimize this to O(N log N)?',
      'Maintain an array tails where tails[i] stores the smallest tail of all increasing subsequences of length i + 1.',
      'For each num, use binary search (lower_bound) to find where it fits in tails.',
      'If num is larger than all tails, append it; otherwise replace the first tail >= num.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;
        for (int x : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), x);
            if (it == tails.end()) tails.push_back(x);
            else *it = x;
        }
        return tails.size();
    }
};`,
      python: `import bisect

class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        tails = []
        for x in nums:
            idx = bisect.bisect_left(tails, x)
            if idx == len(tails):
                tails.append(x)
            else:
                tails[idx] = x
        return len(tails)`,
      java: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Solution {
    public int lengthOfLIS(int[] nums) {
        List<Integer> tails = new ArrayList<>();
        for (int x : nums) {
            int idx = Collections.binarySearch(tails, x);
            if (idx < 0) idx = -(idx + 1);
            if (idx == tails.size()) tails.add(x);
            else tails.set(idx, x);
        }
        return tails.size();
    }
}`,
      javascript: `var lengthOfLIS = function(nums) {
    const tails = [];
    for (const x of nums) {
        let l = 0, r = tails.length;
        while (l < r) {
            const mid = Math.floor((l + r) / 2);
            if (tails[mid] < x) l = mid + 1;
            else r = mid;
        }
        if (l === tails.length) tails.push(x);
        else tails[l] = x;
    }
    return tails.length;
};`,
    },
  },

  // 322. Coin Change
  {
    id: '322',
    frontendQuestionId: '322',
    title: 'Coin Change',
    titleSlug: 'coin-change',
    difficulty: 'Medium',
    topicTags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    paidOnly: false,
    acceptanceRate: 44.5,
    url: 'https://leetcode.com/problems/coin-change/',
    source: 'curated_catalog',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    examples: [
      {
        input: 'coins = [1,2,5], amount = 11',
        output: '3',
        explanation: '11 = 5 + 5 + 1',
      },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    hints: [
      'Let dp[i] be the minimum coins needed to make amount i.',
      'Initialize dp array of size amount + 1 with infinity, and dp[0] = 0.',
      'For each coin in coins and for each i from coin to amount: dp[i] = min(dp[i], dp[i - coin] + 1).',
      'Return dp[amount] if != infinity else -1.',
      'Time complexity is O(amount * len(coins)).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int coin : coins) {
            for (int i = coin; i <= amount; ++i) {
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
      python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for coin in coins:
            for i in range(coin, amount + 1):
                dp[i] = min(dp[i], dp[i - coin] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`,
      java: `import java.util.Arrays;

class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
      javascript: `var coinChange = function(coins, amount) {
    const dp = new Array(amount + 1).fill(amount + 1);
    dp[0] = 0;
    for (const coin of coins) {
        for (let i = coin; i <= amount; i++) {
            dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
};`,
    },
  },

  // 56. Merge Intervals
  {
    id: '56',
    frontendQuestionId: '56',
    title: 'Merge Intervals',
    titleSlug: 'merge-intervals',
    difficulty: 'Medium',
    topicTags: ['Array', 'Sorting', 'Intervals'],
    paidOnly: false,
    acceptanceRate: 47.3,
    url: 'https://leetcode.com/problems/merge-intervals/',
    source: 'curated_catalog',
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start_i <= end_i <= 10^4'],
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping.' },
    ],
    hints: [
      'Sort the intervals by their start time.',
      'Initialize merged with the first interval.',
      'For each subsequent interval, if its start <= merged.back().end, there is an overlap!',
      'Merge them by setting merged.back().end = max(merged.back().end, interval.end).',
      'Otherwise, append the interval as a new non-overlapping range.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged;
        for (const auto& iv : intervals) {
            if (merged.empty() || merged.back()[1] < iv[0]) {
                merged.push_back(iv);
            } else {
                merged.back()[1] = max(merged.back()[1], iv[1]);
            }
        }
        return merged;
    }
};`,
      python: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = []
        for iv in intervals:
            if not merged or merged[-1][1] < iv[0]:
                merged.append(iv)
            else:
                merged[-1][1] = max(merged[-1][1], iv[1])
        return merged`,
      java: `import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < iv[0]) {
                merged.add(iv);
            } else {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], iv[1]);
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
      javascript: `var merge = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const iv of intervals) {
        if (!merged.length || merged[merged.length - 1][1] < iv[0]) {
            merged.push(iv);
        } else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], iv[1]);
        }
    }
    return merged;
};`,
    },
  },

  // 78. Subsets
  {
    id: '78',
    frontendQuestionId: '78',
    title: 'Subsets',
    titleSlug: 'subsets',
    difficulty: 'Medium',
    topicTags: ['Array', 'Backtracking', 'Bit Manipulation'],
    paidOnly: false,
    acceptanceRate: 77.4,
    url: 'https://leetcode.com/problems/subsets/',
    source: 'curated_catalog',
    description: `Given an integer array \`nums\` of unique elements, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.`,
    constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10', 'All the numbers of nums are unique.'],
    examples: [
      { input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' },
      { input: 'nums = [0]', output: '[[],[0]]' },
    ],
    hints: [
      'Each element has 2 choices: include it in the subset or omit it.',
      'Total number of subsets is 2^N.',
      'Use recursion with a current index and path, or iterate over bitmasks from 0 to 2^N - 1.',
      'Push path to result at every step of the backtracking recursion.',
      'Time complexity is O(N * 2^N) and space complexity is O(N).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        function<void(int)> dfs = [&](int idx) {
            res.push_back(path);
            for (int i = idx; i < nums.size(); ++i) {
                path.push_back(nums[i]);
                dfs(i + 1);
                path.pop_back();
            }
        };
        dfs(0);
        return res;
    }
};`,
      python: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res = []
        path = []
        def dfs(idx):
            res.append(list(path))
            for i in range(idx, len(nums)):
                path.append(nums[i])
                dfs(i + 1)
                path.pop()
        dfs(0)
        return res`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(0, nums, new ArrayList<>(), res);
        return res;
    }
    private void dfs(int idx, int[] nums, List<Integer> path, List<List<Integer>> res) {
        res.add(new ArrayList<>(path));
        for (int i = idx; i < nums.length; i++) {
            path.add(nums[i]);
            dfs(i + 1, nums, path, res);
            path.remove(path.size() - 1);
        }
    }
}`,
      javascript: `var subsets = function(nums) {
    const res = [];
    const path = [];
    const dfs = (idx) => {
        res.push([...path]);
        for (let i = idx; i < nums.length; i++) {
            path.push(nums[i]);
            dfs(i + 1);
            path.pop();
        }
    };
    dfs(0);
    return res;
};`,
    },
  },

  // 102. Binary Tree Level Order Traversal
  {
    id: '102',
    frontendQuestionId: '102',
    title: 'Binary Tree Level Order Traversal',
    titleSlug: 'binary-tree-level-order-traversal',
    difficulty: 'Medium',
    topicTags: ['Tree', 'Breadth-First Search', 'Binary Tree'],
    paidOnly: false,
    acceptanceRate: 67.2,
    url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    source: 'curated_catalog',
    description: `Given the \`root\` of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).`,
    constraints: ['The number of nodes in the tree is in the range [0, 2000].', '-1000 <= Node.val <= 1000'],
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
      { input: 'root = [1]', output: '[[1]]' },
      { input: 'root = []', output: '[]' },
    ],
    hints: [
      'A Queue is the natural data structure for Breadth-First Search level by level.',
      'At each iteration of the while queue loop, record queue.size() as the number of nodes on the current level.',
      'Pop that exact count of nodes, collect their values, and push their non-null children.',
      'Append the current level list to the output.',
      'Time complexity is O(N) and space complexity is O(N).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        if (!root) return {};
        vector<vector<int>> res;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int sz = q.size();
            vector<int> level;
            for (int i = 0; i < sz; ++i) {
                TreeNode* node = q.front(); q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            res.push_back(level);
        }
        return res;
    }
};`,
      python: `from collections import deque

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        if not root: return []
        res = []
        q = deque([root])
        while q:
            sz = len(q)
            level = []
            for _ in range(sz):
                node = q.popleft()
                level.append(node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
            res.append(level)
        return res`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) return res;
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while (!q.isEmpty()) {
            int sz = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < sz; i++) {
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            res.add(level);
        }
        return res;
    }
}`,
      javascript: `var levelOrder = function(root) {
    if (!root) return [];
    const res = [];
    const q = [root];
    while (q.length) {
        const sz = q.length;
        const level = [];
        for (let i = 0; i < sz; i++) {
            const node = q.shift();
            level.push(node.val);
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
        }
        res.push(level);
    }
    return res;
};`,
    },
  },

  // 153. Find Minimum in Rotated Sorted Array
  {
    id: '153',
    frontendQuestionId: '153',
    title: 'Find Minimum in Rotated Sorted Array',
    titleSlug: 'find-minimum-in-rotated-sorted-array',
    difficulty: 'Medium',
    topicTags: ['Array', 'Binary Search'],
    paidOnly: false,
    acceptanceRate: 50.8,
    url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    source: 'curated_catalog',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of unique elements, return the minimum element of this array.

You must write an algorithm that runs in \`O(log n)\` time.`,
    constraints: ['n == nums.length', '1 <= n <= 5000', '-5000 <= nums[i] <= 5000', 'All the integers of nums are unique.'],
    examples: [
      { input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'The original array was [1,2,3,4,5] rotated 3 times.' },
      { input: 'nums = [4,5,6,7,0,1,2]', output: '0', explanation: 'The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.' },
      { input: 'nums = [11,13,15,17]', output: '11' },
    ],
    hints: [
      'Compare nums[mid] with nums[right].',
      'If nums[mid] > nums[right], the inflection point (minimum) must lie strictly to the right of mid, so left = mid + 1.',
      'If nums[mid] <= nums[right], mid itself could be the minimum or the minimum is to the left, so right = mid.',
      'Stop when left == right and return nums[left].',
      'Time complexity is O(log N) and space complexity is O(1).',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int findMin(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] > nums[r]) l = mid + 1;
            else r = mid;
        }
        return nums[l];
    }
};`,
      python: `class Solution:
    def findMin(self, nums: list[int]) -> int:
        l, r = 0, len(nums) - 1
        while l < r:
            mid = (l + r) // 2
            if nums[mid] > nums[r]:
                l = mid + 1
            else:
                r = mid
        return nums[l]`,
      java: `class Solution {
    public int findMin(int[] nums) {
        int l = 0, r = nums.length - 1;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] > nums[r]) l = mid + 1;
            else r = mid;
        }
        return nums[l];
    }
}`,
      javascript: `var findMin = function(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] > nums[r]) l = mid + 1;
        else r = mid;
    }
    return nums[l];
};`,
    },
  },

  // 215. Kth Largest Element in an Array
  {
    id: '215',
    frontendQuestionId: '215',
    title: 'Kth Largest Element in an Array',
    titleSlug: 'kth-largest-element-in-an-array',
    difficulty: 'Medium',
    topicTags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'],
    paidOnly: false,
    acceptanceRate: 67.4,
    url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    source: 'curated_catalog',
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k-th\` largest element in the array.

Note that it is the \`k-th\` largest element in the sorted order, not the \`k-th\` distinct element.

Can you solve it without sorting?`,
    constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' },
      { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4' },
    ],
    hints: [
      'A min-heap of size k keeps the k largest elements seen so far.',
      'For each element in nums, push to min-heap. If heap size > k, pop the smallest element.',
      'At the end, top of the min-heap is the k-th largest element in O(N log k) time.',
      'Alternatively, Quickselect achieves O(N) average time complexity.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> minHeap;
        for (int x : nums) {
            minHeap.push(x);
            if (minHeap.size() > k) minHeap.pop();
        }
        return minHeap.top();
    }
};`,
      python: `import heapq

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        return heapq.nlargest(k, nums)[-1]`,
      java: `import java.util.PriorityQueue;

class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : nums) {
            minHeap.offer(x);
            if (minHeap.size() > k) minHeap.poll();
        }
        return minHeap.peek();
    }
}`,
      javascript: `var findKthLargest = function(nums, k) {
    nums.sort((a, b) => b - a);
    return nums[k - 1];
};`,
    },
  },

  // 239. Sliding Window Maximum
  {
    id: '239',
    frontendQuestionId: '239',
    title: 'Sliding Window Maximum',
    titleSlug: 'sliding-window-maximum',
    difficulty: 'Hard',
    topicTags: ['Array', 'Queue', 'Sliding Window', 'Heap (Priority Queue)', 'Monotonic Queue'],
    paidOnly: false,
    acceptanceRate: 46.9,
    url: 'https://leetcode.com/problems/sliding-window-maximum/',
    source: 'curated_catalog',
    description: `You are given an array of integers \`nums\`, there is a sliding window of size \`k\` which is moving from the very left of the array to the very right. You can only see the \`k\` numbers in the window. Each time the sliding window moves right by one position.

Return the max sliding window.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '1 <= k <= nums.length'],
    examples: [
      {
        input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3',
        output: '[3,3,5,5,6,7]',
        explanation: 'Window position: [1 3 -1] -> 3; [3 -1 -3] -> 3; [-1 -3 5] -> 5; [-3 5 3] -> 5; [5 3 6] -> 6; [3 6 7] -> 7',
      },
      { input: 'nums = [1], k = 1', output: '[1]' },
    ],
    hints: [
      'How to maintain the maximum in O(1) time per step instead of O(k)?',
      'Use a Monotonic Deque storing indices whose corresponding values are in decreasing order.',
      'Before pushing index i, pop all indices from the back whose values are <= nums[i].',
      'Remove indices from the front that have fallen out of the window (index <= i - k).',
      'The maximum for the current window is always at deque.front()! Overall O(N) time.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;
        vector<int> res;
        for (int i = 0; i < nums.size(); ++i) {
            while (!dq.empty() && dq.front() <= i - k) dq.pop_front();
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
            dq.push_back(i);
            if (i >= k - 1) res.push_back(nums[dq.front()]);
        }
        return res;
    }
};`,
      python: `from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        dq = deque()
        res = []
        for i, num in enumerate(nums):
            while dq and dq[0] <= i - k:
                dq.popleft()
            while dq and nums[dq[-1]] <= num:
                dq.pop()
            dq.append(i)
            if i >= k - 1:
                res.append(nums[dq[0]])
        return res`,
      java: `import java.util.*;

class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] res = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
        }
        return res;
    }
}`,
      javascript: `var maxSlidingWindow = function(nums, k) {
    const dq = [];
    const res = [];
    for (let i = 0; i < nums.length; i++) {
        while (dq.length && dq[0] <= i - k) dq.shift();
        while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
        dq.push(i);
        if (i >= k - 1) res.push(nums[dq[0]]);
    }
    return res;
};`,
    },
  },

  // 338. Counting Bits
  {
    id: '338',
    frontendQuestionId: '338',
    title: 'Counting Bits',
    titleSlug: 'counting-bits',
    difficulty: 'Easy',
    topicTags: ['Dynamic Programming', 'Bit Manipulation'],
    paidOnly: false,
    acceptanceRate: 77.8,
    url: 'https://leetcode.com/problems/counting-bits/',
    source: 'curated_catalog',
    description: `Given an integer \`n\`, return an array \`ans\` of length \`n + 1\` such that for each \`i\` (\`0 <= i <= n\`), \`ans[i]\` is the number of \`1\`'s in the binary representation of \`i\`.`,
    constraints: ['0 <= n <= 10^5'],
    examples: [
      { input: 'n = 2', output: '[0,1,1]', explanation: '0 --> 0 (0 ones), 1 --> 1 (1 one), 2 --> 10 (1 one)' },
      { input: 'n = 5', output: '[0,1,1,2,1,2]' },
    ],
    hints: [
      'Notice that i >> 1 has all bits of i except the least significant bit.',
      'Therefore, ans[i] = ans[i >> 1] + (i & 1).',
      'This computes all answers from 0 to n in linear O(N) time without looping over 32 bits!',
      'Base case: ans[0] = 0.',
      'Space complexity is O(1) extra beyond the returned array.',
    ],
    starterCode: {
      cpp20: `class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> ans(n + 1, 0);
        for (int i = 1; i <= n; ++i) {
            ans[i] = ans[i >> 1] + (i & 1);
        }
        return ans;
    }
};`,
      python: `class Solution:
    def countBits(self, n: int) -> list[int]:
        ans = [0] * (n + 1)
        for i in range(1, n + 1):
            ans[i] = ans[i >> 1] + (i & 1)
        return ans`,
      java: `class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            ans[i] = ans[i >> 1] + (i & 1);
        }
        return ans;
    }
}`,
      javascript: `var countBits = function(n) {
    const ans = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
        ans[i] = ans[i >> 1] + (i & 1);
    }
    return ans;
};`,
    },
  },
];
