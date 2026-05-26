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


## 2.1. Learning Agent 세팅


	### 2.1.1.Learning Agents Manager 추가

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

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/91367b12-bf40-474e-b3fd-8e8f657459f5/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666TWL6Z6B%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071935Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIG5wmqemWrYADf4v%2Fdqk7O6Xj7gH3ZCfpOknItEYfXRlAiEAu%2BTHql03DB4jldBjiR2CCDlnV3lSr6d%2FI3o%2FgBpyXS4q%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDNZmJp90UMG%2BCGAnEyrcA21gLllbH9iAWyJ20UfCRlOLuuWVVn8BW9FvJVW8gXPwdsXb52raiHMC4Jvw%2BkdHfsipG5Q%2BctbqT%2FAUK2JhgoR1PzNdkUfgmjs6KIGjTtMe5xpaBCTT43leYOnzcY%2F83S42sY93iUkrw4uYnZOTdl8oU3oZWk9WSPgWL4CCcV4OEQPw8zafZRMqzxKPsR3RXUlWA7ey7xO741DyslHPD%2FqiJtEIZixtzRnupgPs2%2BA8LnTOL72Vwq4gn0dXD46O12lxJC1G3mE%2BNuchBLE%2BXbPePZk7kexvuy%2BYcP0%2BRUx%2FouW9nw%2FkPlDo6Ryl7p4MkeKt%2ByTb7JewD8cEMbNrLfDncnBLL0akB6yl%2BHS3q6sfScCEk5sJaUmH%2BtibimJ5seqUTfJtN1PJ2LHycEeTxV6%2B7btqOKX03u5lBJ0Hh%2Fr5iG7Iaay%2FOjoavWMtNjdKaNyfD5lLeAepIwUmuf2kNRdGpLYClDws6H1NxYizs9bXrOJTCEOJbj%2BDLt6tz7Jsw9mAJvgArX71FPm6MQv9eDBxZ2FBXc34zMQLPtBDSRwdmzanur6SFKTWIWYIHjXYFOnatZPIUDqAt5bOs8OU%2FAgwoVEQ4fTKqepVLZOXvy7sBog8R0hFGnrnpOswMNaB1dAGOqUB%2FwzZDzqOMNMhSsMQG6sDfO3t7DUvwXge4bxdOJ4iciLHhFPMxQWj2bfSoqpuBp%2BANU3o5lCBIQGGhLRjdQmJv%2FkoyftuLgRtk4rdC9B5eBPRyzWOFEOsGCA6YW%2F2NmT2ppVpCtd6vtZ1Kbc8OB%2FH%2BiKCbIi3566nuCuCawMyWp6WaWQq5wNenueW7j16f6JuqKwk0qbJds6mhoMCkowXubSvWCwq&X-Amz-Signature=ecc55a027d1464382c7d882529cc377e078cec1b7338bfdc83a2c274e2f88940&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 이제 `**BP_SpiderTrainingManager**`** 안에 Learning Agents Manager 컴포넌트를 추가해보자**

			액터 더블 클릭 → 컴포넌트 패널에서 추가 버튼 → Learning Agents Manager 추가 


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/a04dc0ad-d212-4b28-bbb5-31346216359e/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QUDK7VC7%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071935Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIACFt%2BjciQW%2FpS%2B7GFZqy9GiUzmlep5qGL5p6abqVtKcAiB4GjBY6K%2FQpsQGZyze1bIpjXf1o8T38rfNCZFaN7KSsyr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMntsUuvLv8hMks2sPKtwDItRqF1A4Yu5hUvZM9osJStH%2BwJpRnrWANl4uoF4NB7oTMQpwTJWi0vLnk2cL%2FIF9Ef8MRkMLqHWXlpFC8PWVH8dJsYS2n9kpTTUxr0OIoOJKxCObTfQv7uAWsxobXZVv2O3FjB2UEYW95lvlvdn2f6zuuSekgQp%2BnhZ34zfYSL59oqIzEP2A5VNai%2FhaNaiQR1oQlWCmAtdnVuv4codzbeoKqd4N6w%2Bz%2BTsP3bghBZMkGGiOUe7PEcRmSPYpq8bd%2BIDD7c50oePv9xDnBPRpBjrvKXsRfsgD3GKNeSYMO3tWOohcj2A6LMxSW6A1MUFM0e%2FqMPvBFexPAMxLu1uIekok7SShUZzIUq3O%2FT%2FX2gx%2B4lkGZiI2CzBjN18LUil0aqcEm55MEQYxnAEfd3aVgL9S%2Bfjyb0DQBT6GoxCVuy1JGhrWzwoeVQ6z12hTiAq29OQ%2FdCec5UJ5lv1cNjfMOC1ZqTvkjeA6IF478gv2BJB9kJZqd49XeAJnf3O%2F9Bn9F5KqL4CH3yYDsslfYOr%2BoLu%2Ban0P3B6lbqi4LaCwDzweIP1X0zBhtuYtqTxO8VvVsgO570J04s0IyLvVcqIHYZyWfKYuBsGuTnTe50y%2B8XPPpQSY4ZvPu3zizdgwpoLV0AY6pgEskmThb21RpNufbfxgBjyjbMtRgFYYB9to2inIpejVWAo3qq6mpY6TsNXMSQwWW9EHPfPYECP2dlg4q%2FtUOPRZXTYAM2ToB4iqTd5lGbYFmvRLyllnimx%2FX%2BYxUGXejNKotU73hGxjtFEArJZi57FpCnepTv69uSFsTJqnb4uD4R2BkHQ1hL8GPIAqwuVfMsCMOOdLu1KE%2F182OzakB8zBkTbt%2Fydz&X-Amz-Signature=b98e7dbf56a542a25a0089d9cd2c356bdad6cb5e2e095735539fe01616f7f2d6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 저장 후 컴파일

	### 2.1.2. BeginPlay에서 거미 로봇 등록하기

		- BP_SpiderTrainingManager를 레벨에 배치(드래그 앤 드랍)
		- 더블클릭해서 이벤트  그래프로 들어가기

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/28993bf3-0c54-4190-a762-2ae8dc425b7b/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WRSLMMYR%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071937Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDMxLYc2QTMWGl2qR0FTBL8CIhrJ4UZzbNj2SKnN48TvAIgDJnt25KhyAHYYc4YA3rH%2Bce9G4KciBOFA6YZ8mMs%2FOkq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDEPqdvlnvdWw9yQ92SrcA7oYpuih8o9k1cCb42wXCe2dxhRPKH%2FeKP8soCA4vQuWMa7DYFRhAGhH7OZiC2k%2FfHwdpzeXDaxZ%2BANBQjWT5EqGOh0vJvFnULO6vgUscDKlwTX2M%2BYhvc8bP0ErHGOzrkqF6L8pybhqAbPDr0GoXhqJw0q5ECo%2FhT%2BcuNf3tCCcIqpjmRziIPAfb7k%2BRAtHUKSvsBmG3QVIJQZNx7bC%2B8f5hlwb5ZMrZjqdvImAjZxTtny39dtDJzy6bFx%2F%2FqzyFBwwmGY9FZw2rAtd3uA6n1blLNU%2BGA4KAANOopivvx4YLlcHDrOXpJZeykODKRKbVD8vCRNgPl3ZvZ5sF8HFpNpueATfh3Rz4xfescLG5hCFcwqJuIb%2FQL4UsMW69QP3hPxGw1g8bHPrU9gMHjpOjot8x7uUH7a1dsnTZK5jygkfhjymU7KIeuJJIUkI7JJ%2FFIEf1XCKKOElJ4hxJbJxWTx%2FL0SWBT2rjfSfEt5KJWtAFysSVujT52SkhVxQWfny2raC7DTO1bOnOYFRYJiCHqS0FYdHVWEnSlZzLAXJEQk0vfE9Etkbw%2BW2PlZsD8aSzpuuM0fqvZWVfjO52OLOTCLlI7NHqPb8chXNpekbGPs9xyTIauE2rraeHTfuMMuI1dAGOqUB%2B2b%2BuEARSjuhBac9vmr6SjsLBv%2Bu%2Byl9hKeXnOF8So4J%2FwA5Jm%2BO3fFkHm8GCwrGqFGzZD8puAxk3Z4Zj7g%2BXjloSy9deo2UEX6go8sX5HfWQN6zPZEH8u92egUcArkKR5E53z2pZ1LFyBJEUvoy4QseVcKsToKv%2BXg9Z3fRQWFPez5VSssLwXiiGMHM%2BxOdBLzVej95K5%2Bo9WugZ024IG3udp4W&X-Amz-Signature=3cdcf56dbdb6179b7c2b5af66f77e19195fdeda0805df8f291e98a49ad3fe078&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 그래프 빈 공간에서 아래 순서대로 노드를 생성

	### 2.1.3. [BP]Agent를 모델에 등록

		1. `Event BeginPlay` 끌어오기
		1. 매니저 컴포넌트 끌어오기→ 드래그 후 Get BP_SpiderLearningManager 선택

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/c2d8aad6-bb95-4c9d-b59a-8eecc575015a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WL2HC7YQ%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071938Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDGmTW01OB45P4TaRLUdJgG%2FnkVRKVATVY6IaTXyCYntgIgMYULBr7OnJ2SXZPgo4gHF0XLIfyOnu8Lv0cLYEM6gJIq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDBEf3e1b%2BWf40MbbCSrcA4hfFm0IMlbzBHk6JGkNPaDoFVBLYIsXrK7k3nm13G7mxz1XU%2Fo1UEXtWKSr8mWlBdvMW4HID%2FmV9pod2xTAyqiVeSc8MJh7UqTNOHou0s5iXTLHcf%2FwofVfcJfmsXSfL4z4FF2K2cBtHMJk%2FEIH3pnxDPQ6%2BMTVY2F%2BHEbpVUw9Ytbaht2zgSiBg5yWMh8oOqImw1Ph7VwZjxrFvxRarb9GnxiRImFjNPbha1vmopL5OnHI0jsPuG2jzNFVeLPftzAkSJZjKERXJIA9Ndj8bSScMX26lyFqhZVcLEb7LUuPXEcPah3RlVGZz3YxFf9iEYGJxtAEuq3doaBas%2BKILWTnikoZHxXyO0MQWQ4YGboFSHDGw7rts6D38U6MFBv%2Bj%2BqeKdd2x51isNFIKCvsSqv4vQ%2B8gYimANFjGsqlEIyf6Ep29rImZ4u%2FtkOiFePABGBxCzA4slGqp3WMKLV6MD%2FC2FHuZbu%2B2ypT5FKyS2r3qGPdcCVzNv8Deuifgbu8erh9TqIkA%2Fsff6BYKdcuV1zt2lAdvk4mdld5osfprc7c4fdfRrQMpmlhOghMIVbhDnkZ0Wh6eMX3iLoPBwR23aeoHLyFsYCGNZfLoco1IFh1a619f3hmW0Ki9X1FMLqA1dAGOqUBpFLwIUDMCSpVzxjyfpfLUsHx1wFMhRM47wMzXtvjX8LOKwf%2FNNYtyrPKT%2BSruLM7xHh2WgUa3XdkCov8AcYAb9ZtWkEpn5NeFI0gpQX5ZHhgL4Rq8SHmiuXkLMtQ1%2BC7ckTw%2FDJ6Z0ponUwA9jABkpiVlcvooqJ7gtFaKx929h3OEU1%2BRnTl2I113hQZWIV9%2FPMvy%2FBZC6Yai0tzum7MtfYTPevh&X-Amz-Signature=477846d910772d28efd89ef893c25327063b946acd511088ea49696396007267&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. 에이전트 매니저 → 에이전트 추가 
		 Manager 컴포넌트에서 `Add Agent`를 호출해 학습 대상으로 쓸 `UObject`를 등록

			()


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e9cc8ab8-677c-4103-8653-91010ce5ac27/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466ZH5HPUG3%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071938Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCo2wxua9br5dlJ2L0Hzd8BHhOeU1K5i1mHJlXt75imWAIhALGcre5zeaMzItxxTRWsuIjs%2FvGNTV49kX1%2Fo%2BB3KKoOKv8DCHgQABoMNjM3NDIzMTgzODA1IgwLxS7dNLo1BDthJKEq3APe1kVUXEzp8IElTbgxH7qA8BBs7HYvHTWwzlgJtJ9SoaxjjjQ468vsDt2w%2FF1JyWGcA35PL%2F8IemAKElzZB8TP32lzfTYrh%2FDtHuDT6wN%2F97mCGNEf5tYM2%2Fy7BfgR940ZK7NhYnUyALcTIXc84J%2BNE65pNy5aTofIL4TTH94KVawcFezE%2Bw%2F9GSdZpFefsigF%2Fuo0swqLaAArCfQ9dcP2WH5yIBWokfSjXl3cJNQtGvgM%2F4qNQ4KawHnETSHBdBmCy5eTdhcXfNyYcjZLhGLd2%2B3GC1g7IgvKA7aqdEwLPwES4z2z2JZRKd2MrREltM%2BJyFYV2ko2MJ7HaG%2FzfKWXLrVSiEqsHx2I%2BiZGGR3HJzJVGvbYZ6m8YEcyOVISi9gXud2a%2FbNes9YkHUHMiyDZT8VuBKNBysEZRUIkPb6TbFb7g0jNoxg5QHwbaf1qL%2BjsW3987ggqCdP52mcNEJzmxauiqVhzSBaFfEpvEUsnoEgvUDGNiJ7HYURMdIcr5y4Sslen5HqsEgz7j3b5keoeTkw6z1o2bH00Lz6QONlBKapivnSzH%2FYr47g9ePTG7UGmQVDWVFcaF7Qeo4yotBO10un5fYW4sxjnq0io55vNMUTpYkUYFDJKSugrIzCSgNXQBjqkAeFWtOFZcnsfDSICCDWpRgaKwOuRw2hhoVRoOsS%2Br0ZBBc%2BYkWMeabWlPQLmmNiCXRm2nGlGp0%2BXtyfEnDdE7zVgOFZV64oXGvd4O8WnSTFpSunSqgQVtwXNtjpiyT6a6joPR9zTJefKkzu6PhyxZcy2%2BfsAAfVhv%2FLdfjpi9NtKQDodZQCRmWmrq8Jc9vDhIsGZ8Mb0%2FSSquhZHRBkIuIC4r2ad&X-Amz-Signature=ef583c14d57382931de56accbdb9f7022170618b4b4bfa103150e26361ef6c14&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. `BeginPlay`를 `Add Agent` 실행 핀에 연결
			- `BeginPlay`를 output 삼각형을  `Add Agent` 왼쪽 위의 실행 핀에 연결

				![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e252971a-b518-4aba-823e-3c5a52db6042/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SM63PFY2%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071940Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDtwef1758vT%2B3sEIv9sDoJVa21BM2IDZEBdMvg%2BSO5%2BwIgZHtGrwSrtiszFayMYtsNqwalUJow3gF%2B59Cg%2FUpAsPAq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDI0ORW4NsiZusxkI9CrcA%2BJAbIUlQ4NBxert662X39z1Rvr4dwiLYnbNkz6H2CekkSrgWZ6CkhqkqNsmSO3Y7nIZy68gW%2FyVQSj4%2FzIP0KwqzyAqmljA7oeZs%2FKcExQTKUXX%2FwNaF1tO5y3ZHk6MlpqAZaNorxCgiJ6sYzZvzLWpIMDVsfc7s9yM1UCy%2FYW2VmnN2UQkTm1TduW6CiftJGGRj9IJJ7UjH6%2FnPORKIBRqIm7g8SWLp9BoICj4XocudFuvPpUi2DBnRgifjnbZFugB1iVyyzxiVbJ6%2F65nkJlgXMnRNdc8mF3HoYTpiAtgA92E3tSMV0uFl4QI3VcYp%2BXrrCjCfJ2bsGWb3aNZD%2By1CniJFHTIzDfLjpXce28m3JUiXxkYOezqoC0V5cM9FI7OJYMZCTe6TFUIbW2%2FnkyyhiSn7TKQbBo1UcURTkaSth3YxH05M%2FAJk5zoEas7FCTpvFYBijjjVbdPw%2FOyLPC2c3LkYuxCCwywLe1RdmZrRybjAPfZwLZTda7%2BECAn%2BhOQ%2FcE9oVOjfpICtTjeX1u2nH1APel0egHGkvDP4GPSW9IrCodLmq4zriVvDedY66SVpjFFGfvUUVybz8dUzDkFXATt%2ByW2PNoj8Oeq2x7TUWFIodW1R%2F5QJAYmMM6C1dAGOqUBoKRJBj4%2FHhJ6nf8BBGLaE6F%2B%2Bd08vUQF3c%2BGrmr0YcY5UGQSnH3FXSFcUps8Eue3c2EUf7TO13CUnJDxKA3FzzJSxbGubDyexUzkkEeukwY0pSd2lT1dHO91pfvXkigyyiBE8YNex6DY19y4v8aoiI02Kxx%2Fmf1PI3ASOZANee4U4jaVSPi4jQciz6VUwjPmDwR2Y9cnXhSuvku5OuAjSm%2BR282g&X-Amz-Signature=c19282b3232c6d395ecefd007834f36bbd7f09facf874b8476b712a3c400f48b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. `Agent`칸에 거미로봇 추가

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/f21a3f5a-eca4-4aa9-a5f3-378b99424734/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666MARANKC%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071940Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCID41mfCdxwlOff9pPZnBvcyceof7difNPz29OnwTyD9%2FAiEA52fCxal%2F%2BixTqOz9mXJUpXNsChWmgQD%2BQDMLUunK6pgq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDD3Oon1kG0D1a4is0ircA%2F11xGglac4sV4NYiQFuFS3Iqtv4cCP8vpOtvlGMNAD1xnhu5eKybVP%2BLbAM1xwUtkPkv8WZnH1ULW4nqppKQQY3NW6IotpZEY8i972b9IUH%2B81SsWDRArzMaj1Fs4LuRfuJIJRJ%2FacKiG0PaZ8zyIDdvlEhHfIbsFq0aZacuC8jnquWQqbiSjsWjlneFRQLibL%2F4SYA5XVADNA01aLsMyZz5htDGbA42KwD2FwXjy%2FUYw2jMTzAhsGZA2N3anh5rzMgoCYWHVixRzpCX%2FoQ1d42sJSS5p85n7cCWpB1Byt0QFj%2FGhqIq3g8lerF1WilpiK%2FILRYrcsuoFCkPcV0e1jYoq75gYc9M619eT9xwQV72g96ANze8s1%2F6SkCaHeCIiAfOhXTE4WDkqyar3oSUEceytewgCyioDNKDCK9cP2xrh3xXAJXJJkMNhWyLYlx4OTK0H%2B5d7C%2BIDFHj%2FeOwHoWIyYmHH5DREu5%2F4XbwHmvPNWmIVNB94aAf74Jc4uGLqQgGDeWn3DBYnHWt0OpEuX8m%2BN7dZjeAVzOr%2BwhGrSKG9k3V5UB%2BJ1amtZ0vKniYEnPqQMZE4G30bQZIcgu%2FrdEESJu5Rl9J8utydd7hBcLe3SrFDt2rXmwGRkbMKGA1dAGOqUBzy7JrIJ%2BQ0smUN8hU%2FQSDG8EWNvPZ6y4UGxGMnURA4CMoedwa%2BPkmb2hf9UxayKbDrtjpxfm3RThUqqy9YKLE4cIz6RaauWjGseiWqaY8fqHVCUuM5xaImLBqkbTbJ2SQNiL%2B8xQZVY1OlCHDdRpjyCtKIpM2P7vVR6hIa2DLEf3%2FAGqFzokJIuNeLoUiKgC3yLs1Arrn%2FEvLVrwE8%2BmJgDYocUq&X-Amz-Signature=e55652335102756abaea7067100355fbacc082f21ff1720c5228067b9d8cf0ca&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. 실행 흐름 정리
			- 결국 클래스를 찾아야 학습하게 되어야하니깐 시작→로봇 클래스 찾기→Agent 추가 이 흐름으로 수정하자

				![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/fa144e87-cd42-45ed-9222-93511bbcddbc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663JMZ4OSF%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071940Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIBF6o9V3vEE1fPXTRu2HUWVe4lyCOkjcKWawnlpyXv3iAiBHBNvJkM46kX5gVX1rO27eYPe5mCTJ6nJo0UfO38PGcCr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMPVGNmkJa0mayIqEmKtwDPLctLNh1OIXSXmmJDiiKf9t0dasYB0xhNlND76Y%2Bcuts%2FXDTrLGxbcI3TCeFnLbUz97%2FHcLZeFI8hN%2Bp6IEo3F656evjwBscEkgX5SSAKmCKU8WQpXeOS8KlbdqDmXYEHUJ9o2P%2FJAFzs%2FDEL4oPBpkuQlktsMrYtFeRfsFHUEk3hAlOGaohlSbFpJ8mBqKx5dFDq%2BArh8DtERDsAYrWuv57CUdwj4BiWKNHYyBMSZdFkw23%2FMSP%2FR1fnxEOZA5WqdKa%2FVIbDmGUfYX3%2F8pVwcrBcqM4Pot%2FBbJO9zdmFPeqekR1OPBubWowvelOKje6mcY0oL3CBGc7E5GHi%2BnRMI1vVxK4LxTWyUg%2BkgV8CpAVELSQXdSI4tu6SPqLd%2B8tMC3O3md35j9CdDzUEoxgwzgrq9P9LVt62by%2Bn2CsB%2BNLiLOm1DpXZaS%2F%2Fsvpgn8fGk2ni9KCHzdxRLLNl4Meg3T%2FoLTyA9ad9dkpM4ubg1294tRy7KkfkV%2B8FBGoy615vXc2OfV3r8bAqd3Ax0%2B8x%2B3h%2BrpblSW6%2FYnMqF5rDASw4I11iHqdrPc9PxxzZ1mjBKKOhwzOmyKdoLDL6fSzGvwLirhJeSiAEXauBYFjKU1n8TB6fi5ufC9yWQIwloDV0AY6pgEMamJMjDpri4oRIXsJmHlApqW60DSe7gIcNB3T3hr1yX9iee%2FAyz3Zm1DP9u2R6l%2Fm9gwARWpIIFeDlHnIHX26YTyKnoY28ONP4EWStChgmgYbNO8h9ObAvZYmFwEmQ5mZN%2B5AFPMmtu3K6lz2zhvWfOFI1LoSOYzXqBkVM8A91eewNk7e8r70WGrzJLZiizssCE2MR9Lj0JQsUUGMMTdt8WMTEZ0M&X-Amz-Signature=831d363a77e4fe27675bc93a5b71600c4b2b5061ed8bc6eb7aec50c20e6e7390&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		Learning Agents의 Manager는 등록된 오브젝트들을 Agent로 추적하고, `Add Agent` 노드로 학습 대상을 추가하는 구조.()

		- 컴파일 후 저

	### 2.1.4. [BP]Interactor 블루프린트 만들기

		- LearningAgent 폴더에 Learning Agents Interactor 블루프린트 클래스 추가

			(이름 : BP_SpiderInteractor)


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/75708a0c-8901-4eeb-9a4b-d079a6cb319a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YAL4BWKL%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071941Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIDrk2HrQ2lq6G6M9pDrtgDy%2FXHHNd6ONT6pqL2heVmK6AiB%2BNCYJYKK0wVeoXIRj5e1XBl%2B%2BNMxQZNRlpY2gUvs0Dyr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIM6QURNnlZxJ7iK%2FpBKtwDGE0JvEnPvzBpUZHV2BERShaKWMGqx%2Fn1g6js80I8HLxXOO%2Fjggl3eqtfDDYeYTRZGvveNsoivmHMQ8t1Si%2B6oxkZHaPnkbWmVp4T7byz26xcY7aHGCIUoa8nsmZ372c%2FFUCsOjtHjfyE%2FndXeM7b3lqx3p0cobbcSbjnxGMdD7J%2B7FjviNZRZNEQwZCdifhqHUZSDWhKZb%2BhR7XhbaKiNpJ%2B5byq%2BOtVAER7rwVjTqJ91l9rrHoBIVefunoq0uUjOSLXtG6Cdty4Q4e%2BXFPPBZrgznkez0e2m3s2jENKOP3b4nuRJh9RSbMfjzoCR5%2BQ%2Fy7LQ%2BukQkIsTw6wSGnneWHCZJ33KIzBN3ceSUapgR0CNQfPJZu7TWlqPtnYW2l3QkNbmSpA8%2BlIjzGvOolGkzMOQnSZOXPMrztSX%2FES60XO%2Brx9vAl0imH0IXFpz4Lp2xVyJQjOIKNIvwq64mzyFOTnBzi8xADBtBypJhQ%2B03wHrW%2F%2Fo9vK23sRz1ruINw2%2FPitQ81qoQJfmc1a6%2BKBKSm0m2%2BQwq%2BFLLwjTBdZ5lVSaLv3%2B%2BvyyHD6%2BzWk8b9LnzDJoeKSd%2Bu616hfhxsp%2Bl0dmHMu0qjp8oURe4CBU89GfLfUvWyOCrHefz8w4IDV0AY6pgG8qcNj9EY9ysWaWVwfY4WGZ2exjHTUQ5SUbE5hVUHUxvo5pMxXgQ7kZH6cRoW7Dh%2F4q9A8A%2BvDOmnTy94H1TKHiaq6Rk0WsIJUOSQpvfIT87SpQ7JZXW37nENHba9Sjs6z53mdpCLedZKk9EOd%2FqeT4h7Y5iRMTp5GHyNaS8dSOgSyqqAPhKZmEbDJrw84f2Seuif4OATijmwdhG%2FalRN9v70%2B2%2BZS&X-Amz-Signature=d93d6553f750d551c770d70ea22024b9352656afc795c42810573595443ae7b0&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- Interactor는 에이전트의 **Observation과 Action 구조를 정의하는 객체**
