문제 설명
정수가 담긴 배열 array와 정수 n이 매개변수로 주어질 때, array에 n이 몇 개 있는 지를 return 하도록 solution 함수를 완성해보세요.

제한사항
1 ≤ array의 길이 ≤ 100
0 ≤ array의 원소 ≤ 1,000
0 ≤ n ≤ 1,000
입출력 예
array	n	result
[1, 1, 2, 3, 4, 5]	1	2
[0, 2, 3, 4]	1	0
입출력 예 설명
입출력 예 #1

[1, 1, 2, 3, 4, 5] 에는 1이 2개 있습니다.
입출력 예 #2

[0, 2, 3, 4] 에는 1이 0개 있습니다.


function solution(array, n) {
    var answer = 0;
    
    // 배열을 순회하면서 n과 같은 값이 있는지 확인
    for (var i = 0; i < array.length; i++) {
        if (array[i] === n) {
            answer++; // n이 발견되면 카운터 증가
        }
    }
    
    return answer; // n의 개수 반환
}
