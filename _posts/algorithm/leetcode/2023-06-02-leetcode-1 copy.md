---
title:  "1. Two Sum"
excerpt: "1. Two Sum"

categories:
    - Leetcode
tags:
    - [Leetcode, Cpp]

toc: true
toc_sticky: true
 
date: 2023-06-02
last_modified_at: 2023-06-02
---
***
## Two Sum

Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.

```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

### 과정

주어진 배열 내에서 합한 수가 target이 되는 index를 찾는 문제이다.

뇌를 쓰지 않고 많든 이중 순회 식은,

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        vector<int>::const_iterator first_iter;
        vector<int>::const_iterator second_iter;
        vector<int> result_v;
        for(first_iter = nums.begin();first_iter !=nums.end();first_iter++)
        {
           for(second_iter = nums.begin();second_iter !=nums.end();second_iter++)
           {
               if (first_iter == second_iter)
               {
                   continue;
               } 
               else
               {
                   if(*first_iter + *second_iter == target)
                   {
                       int first_index = first_iter-nums.begin();
                       int second_index = second_iter - nums.begin();
                       result_v = {first_index, second_index};
                   }                
               }
           }        
        }  
    return result_v;
    };
};
```

통과는 했지만…


이중 for문으로 O(n^2)을 찍어버렸다.

또 Follow-up을 보면…

**Follow-up:** Can you come up with an algorithm that is less than `O(n2)` time complexity?

## 가장 추천 많이 받은 풀이

O(n) 풀이

```cpp
#include <unordered_map>

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;

        for(int i = 0; i < nums.size(); i++){
            if(mp.find(target - nums[i]) == mp.end())//1*
                mp[nums[i]] = i;
            else
                return {mp[target - nums[i]], i};
        }

        return {-1, -1};
    }
};
```

이렇게 Ordered map 을 사용해서 푸는 방식이다.

1*. map의 find()함수는

- 찾는 key 값이 발견되면 해당 요소에 대한 iterator를 return
- 찾는 key 값이 없으면 map::end() 함수를 return 한다

즉 찾는 key 값이 없다면, 현재 참조하고 있는 값을 key와 value로 하는 값을 찾는다

간략하게 예시로 이해해보자

**ex) [3,1,2,4,8] // target = 7 예상 정답 [0, 3]**

**i=0**

mp.find(7-3) ==mp.end() → true

key value

3 → 0

**i=1**

mp.find(7-1) ==mp.end() → true

key vaulue

3 → 0

1 → 1

**i=2**

mp.find(7-2) == mp.end() → true

key value

3 → 0

1 → 1

2 → 2

**i=3**

mp.find(7-4) == mp.end() → false

return {mp[target - nums[i]], i} → mp[3], 3 → 0,3

값을 만날 때마다 1)뺀 값과 위치를 저장 2) 만난 값과의 차이 값의 key값이 있는 지를 조회하는 방법이다. 이런 쓰임새도 있구나…

***
[맨 위로 이동하기](#){: .btn .btn--primary }{: .align-right}