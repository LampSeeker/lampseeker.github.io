---
title: "Learning Agent 적용"
date: "2026-05-20T12:07:00.000Z"
lastmod: "2026-05-26T01:44:00.000Z"
draft: false
status: "Public"
tags:
  - "2단계"
authors:
  - "조현근"
NOTION_METADATA:
  object: "page"
  id: "3665b029-aea6-80a8-a988-d7dbbfdf1864"
  created_time: "2026-05-20T12:07:00.000Z"
  last_edited_time: "2026-05-26T01:44:00.000Z"
  created_by:
    object: "user"
    id: "8a6abdaf-1484-467c-9b3e-9c7cb5e280ec"
  last_edited_by:
    object: "user"
    id: "8a6abdaf-1484-467c-9b3e-9c7cb5e280ec"
  cover: null
  icon: null
  parent:
    type: "data_source_id"
    data_source_id: "3635b029-aea6-8038-9b11-000b2ac83943"
    database_id: "3635b029-aea6-80e2-835d-cbe9bc8776c7"
  in_trash: false
  is_archived: false
  is_locked: false
  properties:
    status:
      id: "DKBC"
      type: "status"
      status:
        id: "?}r^"
        name: "Public"
        color: "green"
    date:
      id: "JGWn"
      type: "created_time"
      created_time: "2026-05-20T12:07:00.000Z"
    tags:
      id: "i%5EKG"
      type: "multi_select"
      multi_select:
        - id: "fa4ff00f-f4a9-4752-972a-fd31cd50a75c"
          name: "2단계"
          color: "pink"
    title:
      id: "title"
      type: "title"
      title:
        - type: "text"
          text:
            content: "Learning Agent 적용"
            link: null
          annotations:
            bold: false
            italic: false
            strikethrough: false
            underline: false
            code: false
            color: "default"
          plain_text: "Learning Agent 적용"
          href: null
  url: "https://www.notion.so/Learning-Agent-3665b029aea680a8a988d7dbbfdf1864"
  public_url: null
  archived: false
MANAGED_BY_NOTION_HUGO: true

---


{{< notion-unsupported-block type=table_of_contents >}}


# 1. Learning Agents 사용할 클래스 정리


거미 로봇의 관절이 모두 정상적으로 접근하다는 것을 확인했으니, 이제 언리얼에서 지원하는 Learning Agent를 켜서 학습 루프까지 진입이 가능한 지 확인해보자


사용할 Learning Agent 요소는 크게 6개로 구성된다


```text
1. BP_SpiderTrainingManager
2. BP_SpiderInteractor
3. BP_SpiderTrainingEnvironment
4. BP_SpiderPolicy
5. BP_SpiderCritic
6. BP_SpiderPPOTrainer
```


하나하나 소개를 해보면


---


# 1. BP_SpiderTrainingManager


## 이미 만든 것


```text
BP_SpiderTrainingManager
└─ BP_SpiderLearningManager 컴포넌트
```


### 역할

- 맵에 실제로 배치되는 **훈련 총괄 액터**
- 거미 로봇을 **Agent로 등록**
- 아래 5개 객체를 생성하고 서로 연결
- 최종적으로 **훈련 시작**을 호출

현재 여기까지 했지:


```text
BeginPlay
→ BP_SpiderRobot 찾기
→ Add Agent
```


---


# 2. BP_SpiderInteractor


## 방금 만들려던 것


### 역할


Interactor는 거미와 학습기 사이의 **입출력 어댑터**야.


```text
거미 현재 상태 → Observation
학습기가 낸 값 → Action → 거미 관절 제어
```


공식 설명도 Interactor가 **Observation과 Action을 통해 에이전트가 환경과 상호작용하는 방식을 정의**한다고 되어 있어.


### 여기서 나중에 구현할 것


### Observation


처음에는 아주 작게 갈 거야.


```text
- 몸체 Pitch / Roll
- 몸체 높이
- 관절 현재 각도
- 관절 각속도
```


### Action


우리가 이미 만든 관절 제어 컴포넌트 쪽으로 연결해서:


```text
- 각 관절 목표 각도 값
```


을 넣을 예정이야.


---


# 3. BP_SpiderTrainingEnvironment


## 새로 만들 것


### 역할


학습에서 **“잘했는지 / 실패했는지”**를 판단하는 곳.


즉:


```text
Reward
Completion
Reset 조건
```


담당이야.


### 여기서 나중에 구현할 것


### Reward


초기에는 너무 욕심내지 않고:


```text
+ 몸을 세우고 버티면 보상
- 몸체가 심하게 기울면 패널티
- 넘어지면 큰 패널티
```


부터 시작하는 게 좋아.


아직 걷기 보상까지 바로 넣지 말고,


**우선 “서 있는 로봇” 학습부터 시키는 방향**이 안정적이야.


### Completion


```text
- 넘어짐
- 몸체 높이가 너무 낮아짐
- 일정 시간 경과
```


### Reset


```text
- 거미 원래 위치로 복귀
- 관절 초기 각도로 복귀
- 물리 속도 초기화
```


---


# 4. BP_SpiderPolicy


## 새로 만들 것


### 역할


학습된 **행동 네트워크**야.


```text
Observation 입력
→ Action 출력
```


즉, “이 상태에서 관절을 어떻게 움직일까?”를 담당하는 모델이라고 보면 돼. 공식 튜토리얼에서도 Interactor, Policy, Trainer를 핵심 구성으로 다룬다.


---


# 5. BP_SpiderCritic


## 새로 만들 것


### 역할


PPO 학습에서 사용하는 **가치 평가 네트워크**야.


쉽게 말하면:


> 지금 상태가 앞으로 보상을 많이 받을 만한 상태인가?


를 추정해주는 보조 모델.


PPO Trainer는 Policy와 Critic 둘 다 필요로 한다.


---


# 6. BP_SpiderPPOTrainer


## 새로 만들 것


### 역할


실제 **강화학습 실행기**야.


```text
Manager
Interactor
Training Environment
Policy
Critic
```


을 받아서 PPO 학습을 시작한다.


공식 `Make PPOTrainer` 노드 입력도 정확히 이 구성을 요구해.


---


# 최종 연결 모양


우리가 `BP_SpiderTrainingManager`의 BeginPlay에서 최종적으로 만들 그래프는 대략 이런 흐름이야.


```text
BeginPlay
  ↓
BP_SpiderRobot 찾기
  ↓
Add Agent

  ↓
Make Interactor
  ↓
Make Training Environment
  ↓
Make Policy
  ↓
Make Critic
  ↓
Make PPOTrainer
  ↓
Begin Training
```


정확히는 몇몇 노드 순서가 조금 달라질 수 있지만, **큰 구조는 이거**야. PPO Trainer가 요구하는 구성요소가 이 다섯 개라서 이 방향 자체는 맞다.


# 2. 작업


{{% details title="2.1. Learning Agent 세팅" %}}

{{% details title="2.1.1.Learning Agents Manager 추가" %}}

- 편집 → 플러그인 → Learning Agent 플러그인 켜고 재시작
- 컨텐츠 브라우저에 LearningAgents 폴더 생성

```c++
BP_SpiderActor
→ 실제 거미 로봇
→ 다리, 몸체, 관절 제어를 가짐

BP_SpiderTrainingManager
→ 학습 관리자
→ 거미 로봇을 “학습 대상”으로 등록하고
   Learning Agents 학습 전체를 관리함
```

- 거미 로봇을 학습 대상으로 등록하고, 관찰값/행동값/보상/학습 실행을 관리하는 훈련 감독자를 등록해야 한다. 이를 위해 관리자 블루프린트 액터를 추가해보자(이름 : BP_SpiderTrainingManager)

![](/notion-assets/3665b029aea6802db93cf444629f8140.png)

- 이제 `**BP_SpiderTrainingManager**`** 안에 Learning Agents Manager 컴포넌트를 추가해보자**

액터 더블 클릭 → 컴포넌트 패널에서 추가 버튼 → Learning Agents Manager 추가 


![](/notion-assets/3665b029aea68098ae8adfeb5ef559ee.png)

- 저장 후 컴파일

{{% /details %}}


{{% details title="2.1.2. BeginPlay에서 거미 로봇 등록하기" %}}

- BP_SpiderTrainingManager를 레벨에 배치(드래그 앤 드랍)
- 더블클릭해서 이벤트  그래프로 들어가기

![](/notion-assets/3665b029aea680cab5f2fc039d474114.png)

- 그래프 빈 공간에서 아래 순서대로 노드를 생성

{{% /details %}}


{{% details title="2.1.3. [BP]Agent를 모델에 등록" %}}

1. `Event BeginPlay` 끌어오기
1. 매니저 컴포넌트 끌어오기→ 드래그 후 Get BP_SpiderLearningManager 선택

![](/notion-assets/3665b029aea680afa643e25f4be748a8.png)

1. 에이전트 매니저 → 에이전트 추가 
 Manager 컴포넌트에서 `Add Agent`를 호출해 학습 대상으로 쓸 `UObject`를 등록

()


![](/notion-assets/3665b029aea680e3a6ffce46f68ccb92.png)

1. `BeginPlay`를 `Add Agent` 실행 핀에 연결
- `BeginPlay`를 output 삼각형을  `Add Agent` 왼쪽 위의 실행 핀에 연결

![](/notion-assets/3665b029aea680c2b5dfcb0a21fd66df.png)

1. `Agent`칸에 거미로봇 추가

![](/notion-assets/3665b029aea6806f97f9e487ab768908.png)

1. 실행 흐름 정리
- 결국 클래스를 찾아야 학습하게 되어야하니깐 시작→로봇 클래스 찾기→Agent 추가 이 흐름으로 수정하자

![](/notion-assets/3665b029aea68026a0e2e061ba8cad87.png)


Learning Agents의 Manager는 등록된 오브젝트들을 Agent로 추적하고, `Add Agent` 노드로 학습 대상을 추가하는 구조.()

- 컴파일 후 저

{{% /details %}}


{{% details title="2.1.4. [BP]Interactor 블루프린트 만들기" %}}

- LearningAgent 폴더에 Learning Agents Interactor 블루프린트 클래스 추가

(이름 : BP_SpiderInteractor)


![](/notion-assets/3665b029aea6802d8c9df39660fa58d2.png)

- Interactor는 에이전트의 **Observation과 Action 구조를 정의하는 객체**

{{% /details %}}

{{% /details %}}

