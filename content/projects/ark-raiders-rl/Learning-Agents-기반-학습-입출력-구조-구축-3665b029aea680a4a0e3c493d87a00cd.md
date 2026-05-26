---
title: "Learning Agents 기반 학습 입출력 구조 구축"
date: "2026-05-20T13:13:00.000Z"
lastmod: "2026-05-26T01:44:00.000Z"
draft: false
status: "Public"
tags:
  - "2단계"
authors:
  - "조현근"
NOTION_METADATA:
  object: "page"
  id: "3665b029-aea6-80a4-a0e3-c493d87a00cd"
  created_time: "2026-05-20T13:13:00.000Z"
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
      created_time: "2026-05-20T13:13:00.000Z"
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
            content: "Learning Agents 기반 학습 입출력 구조 구축"
            link: null
          annotations:
            bold: false
            italic: false
            strikethrough: false
            underline: false
            code: false
            color: "default"
          plain_text: "Learning Agents 기반 학습 입출력 구조 구축"
          href: null
  url: "https://www.notion.so/Learning-Agents-3665b029aea680a4a0e3c493d87a00cd"
  public_url: null
  archived: false
MANAGED_BY_NOTION_HUGO: true

---


# 1. 소개

- 거미 로봇의 관절이 모두 정상적으로 접근하다는 것을 확인했으니, 이제 언리얼에서 지원하는 Learning Agent를 켜서 학습 루프까지 진입이 가능한 지 확인해보자
- 사용할 Learning Agent 요소는 크게 6개로 구성된다

	```text
	1. BP_SpiderTrainingManager
	2. BP_SpiderInteractor
	3. BP_SpiderTrainingEnvironment
	4. BP_SpiderPolicy
	5. BP_SpiderCritic
	6. BP_SpiderPPOTrainer
	```


## 1.1. Agent 요소 소개


	### 1. BP_SpiderTrainingManager

		- 맵에 실제로 배치되는 **훈련 총괄 액터**
		- 거미 로봇을 **Agent로 등록**
		- 아래 5개 객체를 생성하고 서로 연결
		- 최종적으로 **훈련 시작**을 호출

	---


	### 2. BP_SpiderInteractor


		Interactor는 거미와 학습기 사이의 **입출력 어댑터**


		```text
		거미 현재 상태 → Observation
		학습기가 낸 값 → Action → 거미 관절 제어
		```


		 Interactor가 **Observation과 Action을 통해 에이전트가 환경과 상호작용하는 방식을 정의**


		```text
		- 몸체 Pitch / Roll
		- 몸체 높이
		- 관절 현재 각도
		- 관절 각속도
		```


		이걸 이미 만든 관절 제어 컴포넌트 쪽으로 연결해서 각 관절 목표 각도 값을 넣을 예정


	---


	### 3. BP_SpiderTrainingEnvironment


		학습에서 “잘했는지 / 실패했는지”를 판단하는 곳


		```text
		Reward
		Completion
		Reset 조건
		```


		```text
		+ 몸을 세우고 버티면 보상
		- 몸체가 심하게 기울면 패널티
		- 넘어지면 큰 패널티
		```


		부터 시작해보기. 아직 걷기 보상까지 바로 넣지 말고,**우선 “서 있는 로봇” 학습부터 시키는 방향**


		```text
		- 넘어짐
		- 몸체 높이가 너무 낮아짐
		- 일정 시간 경과
		```


		```text
		- 거미 원래 위치로 복귀
		- 관절 초기 각도로 복귀
		- 물리 속도 초기화
		```


	---


	### 4. BP_SpiderPolicy


		학습된 **행동 네트워크**


		```text
		Observation 입력
		→ Action 출력
		```


		즉, “이 상태에서 관절을 어떻게 움직일까?”를 담당하는 모델


		공식 튜토리얼에서도 Interactor, Policy, Trainer를 핵심 구성으로 다룸


	---


	### 5. BP_SpiderCritic


		PPO 학습에서 사용하는 **가치 평가 네트워크**


		쉽게 말하면


		> 지금 상태가 앞으로 보상을 많이 받을 만한 상태인가?


		를 추정해주는 보조 모델


		PPO Trainer는 Policy와 Critic 둘 다 필요로 한다.


	---


	### 6. BP_SpiderPPOTrainer


		실제 **강화학습 실행기**


		```text
		Manager
		Interactor
		Training Environment
		Policy
		Critic
		```


		을 받아서 PPO 학습을 시작


		공식 `Make PPOTrainer` 노드 입력도 정확히 이 구성을 요구


## 1.2. 최종 연결 모양


우리가 `BP_SpiderTrainingManager`의 BeginPlay에서 최종적으로 만들 그래프는 대략 이런 흐름이다


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


---


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

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/91367b12-bf40-474e-b3fd-8e8f657459f5/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YV4F2WBV%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071834Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCO0meq%2BIAR%2BXQ1twgrEQNKFpnUUnlDLCLkiVXcj2jyiwIgQABcRhPQ%2FOws9gT9pGwRS%2BWie0eLmezAmy7OTKKWKmsq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDFNgTjZNTmHTeWmozircA1b%2BQecLSH3JpLoXKR9lSyV%2FZyCBFfWGqi%2BAOdFLXJoDmxk5Vqwuym4kEtOGHgaA80rNbjSJ9IWivZotLapIvoahnW7g3nI0UiPwnsapT4A%2B2EWM0E5DHti6DZ1z7LgZ1GWpHZuxIRHfH9%2FABc5%2B5OkrC7VMHVzkjlXbQ0%2FYhqocFnf%2FvtP1Xm%2FlE6ytVN8YFUsWChy8vhu2XlLJhp0MpjBVjL5pmhd5xDLtBMrlG2Vz2TJPOoVbBdl4Z423mnZ7EubvmG6xhvWmr2vk8Q3Ww2RMwwQLR%2Bf3pyZRglPj%2FhSsByswfog8NQr%2F4iyBmmO65Pkk7wX3uOYnNQLBzEXQxwjYFxsT%2FUp3ZBGhe1XySISTgPlH%2FIXVuYDudcfYkMloRFU7f2s5PB72740tlRQ1%2B30BnF6B9lbXpiOrKGIu22JBr8WbMcYA4jdvXJSseVelIBGNRNDL%2BBPjruwDRGLEP6rsvoVmf%2FJUzVtDS3q1GMlg0MVn0GRv5KSjDfXcf7Cq5Brp4dbtpGf4ro9mjffBP04p4d9M5IRzEDZi3molLwqJfFozi1jRlh0q6UDn3CISXEfi%2Fv87%2Bi0VhQd4itGzct6juEQjKk5QGfol04Z4zhdF2GGwiY9npasp9dlsMICD1dAGOqUBWgmT4w53h0uH66tnAoVFr6pYJitNobMVxuxLXb%2Fcj%2Bh6kTsBphkt7Zu3xN9Bh1hpZPMNbLk0iPxDCOcdLf5zFzgMLAwPTUMLfr0rvS2HTTtL9EqOwoUqNfHRpp%2FpvZM0OyibW0lu%2BUGMVN9MMVj6p%2F4gM8ZtqaKs6MKRYjmkKuKcuIttN3O8yMggcZd6oG3BlVCTgrwSAZo3xBvkPSuAne%2BVqNB8&X-Amz-Signature=4fba4f9941ac15cae31c557ee122f6c1853253c2f964ac3c8aa658306b5f0ab3&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 이제 `**BP_SpiderTrainingManager**`** 안에 Learning Agents Manager 컴포넌트를 추가해보자**

			액터 더블 클릭 → 컴포넌트 패널에서 추가 버튼 → Learning Agents Manager 추가 


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/a04dc0ad-d212-4b28-bbb5-31346216359e/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4665V7P7TYJ%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071834Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIHXcDN92swaHblaNwqls6C5dSjNnFr90s%2FXdH0d925JhAiEAndt36%2B44wnRnU2dogEFPnO9Qp91Ce5HFLXccmqpQhPUq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDFMtMQFQQ4NpmCHMCircA1VktAg%2F0APk8GvGmKj6zcBnSzY9eDvjH0Gk4bHqm1WIzl6TbLidKS5P1tYM%2Fx8bGX3pQI5YggCC1CSvG9aexNbw8mJ94jktYPvqbMODjaaYuEzG3fOw9KgXXIUXMxfS6lxd22tZXyUrBFFdA2bc6yQh5DK5ePMUVrmuUeNoIBsFi0ek1GuL8ZTKoD4MDxI3MkPasfTtHclgLpJzMjqEYUU9J7ypJc9Ob3BI3qW7EAQkmq9aROMn7HuszBRj8BjX0Vo7o3l4shRSUMCy65UvvRT5azbviL9Ku3WgK5UH22d5Qb%2F8W9rlOfe6zh%2F9cguFsRo99Q%2B%2FWZ6kArcDHENCjyNuZBukiLbf97HZ%2Fn%2FG46wRzB%2FDhdf9XkSaCQ16q%2Bm7yGYGdSo0%2FPYK3WwnyWGaNroOZslF8o8QyXYCbOXQqy2pNwC88arjnd6bIbE%2FHLUc5EEUuT1LW0XWCbVDaUQSmtAdjHU%2B5%2B%2FgoopG8CusGGwQsQxGVR7Z7Rw4FwtJHg8Xi%2Fm%2B%2BOFaHoruyGXRyFHu4XW%2BJO0Acm3TYCwZD4K%2FMFb4dcc5fogQ6k3VnRD5fRAzx4AoSk3wVeSQOnI77JZKQIPZhYy9okiY0tXwZqbIhnNxVs4ElfXDhOsl7Me%2BMP6A1dAGOqUBkhppStFlc05f3QHrDQsFjf2Qi6yFGo4FkEPksLgS2XJCdjzoneEfJpNbtfZ33fSMx7Wb1Otagqd7W3Bpcp82X%2Bhxfgm2%2FGtNLlQ7kXu1aqOg9j3WD0xgavVrHVCKH0GsSzDEKqYUOrxlJYZjaU7rWCY2b09j4sDSXtYGtLizUpGq6juWywSH9Oh1ICxPHTYbeXPCJlKSnOR3kBELK2S8JUDBGhVD&X-Amz-Signature=b0a1eef1bbdc5fca7e4c5a4cbda8353d73a56b9279ec43c1866d3968a9dffd06&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 저장 후 컴파일

	### 2.1.2. BeginPlay에서 거미 로봇 등록하기

		- BP_SpiderTrainingManager를 레벨에 배치(드래그 앤 드랍)
		- 더블클릭해서 이벤트  그래프로 들어가기

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/28993bf3-0c54-4190-a762-2ae8dc425b7b/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QUMREBZB%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071835Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCojvKjAfk%2F2E20E%2BooOD%2BikimcvjQnxg0JZjl4zwahiQIgUAF9V0WcoDzF9350WhDAbAz6%2Fx0ojRdEdluDP7%2FOz4kq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDC1r5NzYbJvyZeLQfSrcA%2FyYFjx08P283rGaEVS952Sq4OBGARxs%2FX7j93PqsHq7G7WrRE%2BePS2vwjE7ru19uhSe%2BJHhiHa5MmvB71xIgiJA3QynX9i0IpjT6tpFvSz55gH7YDtm%2BHHtetJ5Bf1I3LRnzVIc5DeLXfr7K%2F2LaqBKF5A9eFfqfNrqgJ7UHGHa1P46uzhC%2FCALQbHypPlDnPv2AnaILNyYpreh3xQ4ht9pmHDDjsAgJNlScWm2JlC7AT%2BbSPp%2F4pAiOcITtUDJRJLW6ZO3lktSVefUG6zeJfwTRcrVsBGdgOSllGtijg5eTWf0iIT6GZPl1BnN1bLdQaU3KkLGCCkrhA8PbfxVvhGbmArtn9DRxTEU4wVPO65DfbB2Xk1DPgnAyd4WCkMzoqPob6Q1o%2FXJKmTINtVeHtODfQOPkkWXAeN7oG05rax7ySYrNAKbMIH4wqoSvjhBSpr0VLmcyeG2QyyissD9KuKbyeYKYlAD3pKT15AO4pZlPVv8XpKnaVdvOcETmiQmwp8v3c5XL3dg0yTGLxtI%2Fv7HIGdX%2F2mq6TilejG1JsvwJE%2F5lKIUo%2Br4lIErO0WfTFVRxExb%2Bbo7TVSGugLshIRECeC5V2aZGp9LsxmXXY6CBKJ9v8oJyPwvN7lfMNWB1dAGOqUBCmdMN8p%2FwrrITraN8mEbXwxehv8OEGtc2Mu3EP1YI%2BzSNaIplmT%2Bmwfj0KKXRAbUBvXxMFC0NIeXABoQz0nEAb7A0Z7POKEzEXF8Zn2RzIlIhmdorhwSDDxwAbPzMkhKGQfacq28CEDdRJVd5gjG9t5uhUmfkK%2FMuRdPDglvT3GY%2FwIUaCGTQftwFPdD4b0jaKRxXIiCl6E1fTYGBEldH8OEvtJ7&X-Amz-Signature=e3fd5c832643bde02d88ed302210c847a84816d5b2472f91fba75607eae55da6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 그래프 빈 공간에서 아래 순서대로 노드를 생성

## 2.2. Agent 블루프린트 세팅

	- Learning Agent 영상을 보면 금방금방 끝날 줄 알았건만, 직접 세팅해야 할 양이 엄청나게 많다.

	### 2.2.1. [BP]Agent를 모델에 등록

		1. `Event BeginPlay` 끌어오기
		1. 매니저 컴포넌트 끌어오기→ 드래그 후 Get BP_SpiderLearningManager 선택

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/c2d8aad6-bb95-4c9d-b59a-8eecc575015a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466Q3QRR7JO%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071836Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQD9dciki1yupCSXNtBOTBpVIjvxdVj%2FFTOGWOgae%2B4f5gIgGOpRO%2FnQ%2FoUCxclnwE%2BzRoZzEkkzDAFXoUAeCEKeG%2Bgq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDHt%2Fkce8aYtnkvQtkircAwfXClSMbX1M9%2BJutybGS1NRYZkV29tyZchzMCXUHNZzE5OFRx25oUq%2FsVfPtmnr7MQdtuVqYqIzb4kcAMbcEJvGmfwbu5vs2mOx5L5cUBnzr%2BZTs2AAPeJO37s58GafoLTgLXa85pNUpNdafkjZH%2FyZkDG4DL2%2BBQZzpMak%2Be5nYy3HnzlL3s%2Bv8aaR6BDV7bUedLmyPpnGVwqz0fmEqjvWsYtvUp8OXe4GQaQ4DWVOIIM5fapQ%2B22bg7TOPh879bWQ4OBuIplzhQEGZ28reNKx7sxKS9GMo3fWEIfWWBh4w7pYJblntZL88m03zgv2WKMjj43c2MWtoaobCecvVpq%2B1z2%2B9WjixuONXHs18OERChN4zcHiSHuPKUGy7706t5p7nKPn7m5RyoS7KuoItw0fux6isI9eElK6ue91kuL2jJkPar88eQerc3N1c03q40%2FvBPOSGBHO2zaOpzv8M0dEUQaAjT6g9DKkIr9QKLz6HHuAwvIJAlVQXsYdvWAogYQuypvuJEzO6c9m%2Fww6RTQgbVNS1VEv8DW%2BtJLEHzAJNmmmeGY8J%2Fitzpqm7S6%2BIU3bxTslnWKPtkTmeiqTiSEXZDNMh7KXozbpqD0JLKK%2FeGXZ73m4JD4sriuPMP2C1dAGOqUBAsxn26cY6294WkNZNwChalaxH3VN17kWqDoXNdEYeqS2xQXurP0dW1BtvdjhT%2BLdUm5zcnT4UHw%2BiLTlrSZaX0nXIu5X0NnALV%2FUqJtDyjIMW9kqe0f3ZaYELEsYIOfG9yhPDeVyR10XuQZZnBP%2Bfkq7sN5NVJ%2Fb33cIoj2wQwxpeTrFnNfcqFfKeFSsPtFytrG8RkeAu1n71eyaLjkmTbKkD%2Bu6&X-Amz-Signature=ee43e8ba0d4424e254d255aceb09d9f5b76abe414aa49273a247e880e011a07a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. 에이전트 매니저 → 에이전트 추가 
		 Manager 컴포넌트에서 `Add Agent`를 호출해 학습 대상으로 쓸 `UObject`를 등록

			()


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e9cc8ab8-677c-4103-8653-91010ce5ac27/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663CH4N2PB%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071836Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBqKGdgR06imJWhBvi75C0gOAho3TdTsaPdzxAiP7YRhAiEApNOCnyYKK%2FcOXZt04inTU0QxyYiKvLG8XxrlAK6jNJ4q%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDDIALyedxVhzUwjqRSrcA4SE%2BhK%2B51cgw2PxzOXkZJkYFmK9Ir8Lc8nErpv1dtZq7sKXutuL0a1fjfgwUQbWsMWfOdBNTaAUx7iMiCxsaNVZMI8mHWZAqi55EGhRElrBgJ6yKw%2BdJXSTHvNm3kto5BYSGMVYGyBQ7N%2BIeX8vFCZS2MExKKLRkBAfdXPb4s47YT52PTrk8naZixJhjV3kTOHPOUaWuG1MQ1THmZ2AqqX7ouB9o4gPgF8%2FlYjGI3jTOGABDB7AcOIFWu%2FbYYR9id5PCXRQky3vf4pl2t6qvjp0OSwls6cwExVONEkW%2BoTGA4FmPP0BBAtcqI6P7x2pHVKki%2B3dxpGcjhq8eqty%2BEyqSE5%2FqNGMBXz%2BVQ%2BUDN0jS7z5QLRAgGtOsxK4jrCwNoVlfNyEs42C3fdBwFQV6mcR6klcM4eohz4XuFbt%2B3pFdPE9w0oYTiF9hiZNtfJ3bq8V4snCfXQpcPkx8nBqaTlDksfViBw8x3JfJpbfR9ljOSOrkBl1xt2WdRpoBqqugZNnP%2Fnr3%2FMkG0RZdDOQMCvl2VL8SXf%2F6ByhNCVX0Ep66bPyp09%2BqUTpQf9sRS3FSzwsuXr1nggJ8ITo35Eik3rFREZV0uqHUS9cvh9wMT1UwwbdetljL1xv0MR5MLyF1dAGOqUBgzSXzVkdiMlNA5gtyg4vTeyHH%2BOaP7ksR4R%2BMd6HrN77%2FgqiiXeAAskx%2Fk%2B%2BGqj7eYJC1dzkoa2GBknZAocqQ2FS0tf8WjQ1j3PY9wONmWl7MdnAXJE1p005NNSGlTIyMbTAIogaT1XHQjnsV9mAu8VgqqPZy80%2B9yHetaO1DjfTshR9j5lWFQlN8aHHgjDPXBEjxJbbwKc%2FW%2BZn8K35wqqPp%2FXs&X-Amz-Signature=71e4a8d5e07a5ef9c1003efaf06dc6b9e7988ad2f3b327c875c9ebaeda69ac25&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. `BeginPlay`를 `Add Agent` 실행 핀에 연결
			- `BeginPlay`를 output 삼각형을  `Add Agent` 왼쪽 위의 실행 핀에 연결

				![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e252971a-b518-4aba-823e-3c5a52db6042/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466Q2WHURGR%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071836Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDma1nhpy9AEI4%2FktNBbVkrQVQYDlwZ759CmmfX2AZgkAIhAKEpWMy4%2FTHY3vGd%2Bj4A37Epfy1B9gybQZipn%2BEi4SS4Kv8DCHgQABoMNjM3NDIzMTgzODA1IgwXUz%2F8Diwr7Zxyiosq3AMK2BhxBkdUjnah38MJ1vVJ75ht%2BhpUliJypA%2Ftz%2Bh%2BL%2B6RKYFxEptrsAw23pn6YiRGzvZFKQzHA2P%2Bi9zVeb6Ym0PbyVdiPZdhm4%2FInMM90Y1tEhvv6HoJpQkbA8oJA27mdaT95WVlANay5iwo7B6F60zFJtrIuaRw9HDHN9vaF8kVJcdLezCOkgbbZu7fYZEOTwqVHgkGZl%2FMEWyMQE7gESo4pswU4dvWujlBCFAJSaEYFDHwD70utFyVG6kH6y3QRh73JvmHcA9F0yE8Zp%2BqdL3vWHRttELSGkCtiWdVn8TdhpQYm9WcO5lrjvC%2BsnPlM9VSriQKLNM%2FNE7zrvmqztHwovonYWdr2Hxao2RiZH2s8fHbDYjUy2FKUh0g4GCN01UTOCCpIQAgQNPqnDSWV3bjsTiR46zOleTuDkSRNLjfj7a4tiwmmyUgjgBLMQCE7xWB8MXScQaglKxnNeri2TFbVE5uFXcqPXUKXasmvflO3%2BXz%2B1gS9%2F2zj5Y3AWrcyfdHhAZ1wB2XXy1UOnTKvmDZcmD8LPHTVRKsj8M9CzlOztT0oaZT1%2BCy0zRe%2FUhMfDhFyyZEUY7bLya%2BCa6Ikh0ujSred%2FWNeKBytUW3c0ToNI0f6EmRLnv%2FNzCrgdXQBjqkAbWeTp3DoNvaadsvkRlva04ssoRs93X3D6ukwtoHxykWE3nPJSHrThiOplRXQv5QV%2B3Hs%2Bg9mDImGJ24RegeDCb1Vf0kaaAQN45%2BaCGqdNTqnA43mCUHwctuH2rJxSyrXnZvy8OloDdT3A8griAFXJhxFQsXHLWTumKu6ZR%2ForgbINNKS7Hy6BCk0ogKUwyoCXF%2BqReWF1yYdXKmpYKuLD3t9BTN&X-Amz-Signature=7d162d0fa2fbc12dac9635d0d31c0255a10572507643c53d7b35194266858449&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. `Agent`칸에 거미로봇 추가

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/f21a3f5a-eca4-4aa9-a5f3-378b99424734/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466R4IKKPQK%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071837Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDCzMa0jSt%2BJU9WxN3Xrn%2FUa%2FIPwKRo9ya%2FD0XpQpEYUAIgVQSxIRKkLH9dCoXBbcWSpgt9tO4rw%2BrLGn139yc4Jacq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDFG6sq4MaN1K8ZB52SrcAx5Ih4ASaCjUsM%2BxQk27sCSEIA1zbxWaGGBCJw40N43lBib3aVVD2%2FhjKrDRN37ylBtxHAZUBrUjw%2BdbYCZA2pAQtzewl3Fct3IUMbiAWnQAw6XtLsX0J%2FD0hfuW6QIrXNe15pzCuc%2B%2BCA1agm5xi55wpwaBELKcGDBA%2FPX7sFwxH5VG8YMaFRGb%2FcQei5owM2WlyLsyFeVPRsr5MAWylMzI%2FEzJrPyO3iWWomQInbZEh%2BuHxG3Pkz2UHFbJt0XeQNQXImE9Yd6wvgTbvJMpk3F%2FOCF8dhy53vNbFuj1kqnXFhC%2FhvvCei0WNdB25ZeEkRAGxWuKvu7%2BDJ6COUHqUSziUViE2K3PzG8I4D2mNdwY%2F2stQxW2hPIuBQV7AlBI2iwMfIr7Y4WRwRiBDIua5gsFUIrDLiiv1p%2BPpSfKVAXTnmKd3jLOkaxqUGPSEZdmrz%2BUTREvgD6v5N%2Bue54MKjb4Pq2wL9LnPbBIlTy8rwixtQo5aM%2FU9b8PUZirvYqKM3vicyzjVySLovycYH%2FiaRLp3xsACv61lV5tgBYpFWtbLhHbOtfID6fMPuGR3TwOZ5D30%2BGwrIzjORQgUoKGOPIzXjrIq7PEhqhihYq3%2Bm4f%2F8PgN0egd61wDfmeMOCA1dAGOqUBhkbs%2BCSBn4gI2Y8BlGylN9ZAOxBlmDWyYJ3Ak%2FA3%2FTfDNDqxiH6UmN%2F8vuTvDvzFSO7QdZAqAf%2BEU%2F5F9OQ8xwjySar%2FgOIvi25yRmeTuDqOEo4zOTlbejcZHGBoNhVYdUu1ft9PbYPlpAHUp%2BTbSEvptOImqPmsVqcgvMNXM0O3x0F%2BKBmsMA8v2PKStfrTiEJmDNrZiqE51IclMUoG6I97uu9N&X-Amz-Signature=ba14cf6f3e42d99ccdbc2f376b8095e4406253fab71f0f509b0c0449e06fd255&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		1. 실행 흐름 정리
			- 결국 클래스를 찾아야 학습하게 되어야하니깐 시작→로봇 클래스 찾기→Agent 추가 이 흐름으로 수정하자

				![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/fa144e87-cd42-45ed-9222-93511bbcddbc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RL26KW2E%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071837Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDoLMSrBmIeD30k9BTDoqTMWjd4YFAZRYkM9qOo3Fo%2FkQIgc9w3fsh%2Fe6A2Uu8BEof48UVJCjRRgGSZX9Xy6s5oSnYq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDKXJoFxW3F1OQnZGWCrcA8FDLQCOw7ti0rOFt7cWw6EhycKv2FQnwaF8cIfbXR9zMokOgujBi0sAjOcFyhTJmI9w2f2rt5JLkGIPxcWAhfC5GAFHHV6iUBC8AYsscBgQuOO7M2oKsQ4WIOLKQvHcOdDRVk0F5IvaKvmpitDqD1JQJi3QpYheC2WppykUT3L9QV501J%2FJqT%2FqZfe7I6YUPIb26todA5RR8BORNi%2FubOvdlyMh%2FdTLvoHCfrQO2MpeTYti76J6PH6kt%2FC8wlDjPWb6PlQMnd2rSV7Nr2zhLsKcaXKEAFN1KnsMxb9cbtFIiFHoCgXuvIyKfDfDQ4kr5IU44P47ZcHzM08J9oxzNJnHRM9dqGv9ps3WbsJ05%2FCwsa7M%2BWuvm1TxHci1zU633v13KGy9SL2kORAOmdmrwvSfw98VUvcCh6Flo0%2B6Ds4JbdsGmb2AdWH%2FZB9v788yn5t%2F%2BmWU24pTdZhtJQIe7KLCePLRpHiGk7fA1gxSd7l79rXVBQL%2FXgTVtParOMN2qehCJerclU4Z1YnkLnnU2WKbMSrvv7e4MTTzDYyLaAVEOZHpP3qkcooqWpHQVjFdzTu%2BZZnOO2NxsJ5nSHzmmAnqZal1rCDKXyD9ZQdsiQ5%2FxQQaLrbIWNMciJ6NMOSA1dAGOqUBX4I5DLTB93xati4dKEc2xJ0Fks4h9woiJNDIWfBeeWlrXm4wwNaK2AWLNjehwz3XrKlUPmg7tDBQnJ9CwvRZULYlPQXNasy6CSXtX%2B29heodVi4CDJ2FGV6AOK0PPgUA6QoTyR7SEZdjw%2B%2FQQp%2FAIbl7B70h8xrlR45W8JPmFSq%2FPwtElJ1Lre2jEe5oa8QP7t%2FljPXg8%2B529o98Z2cJvOwQ430X&X-Amz-Signature=bd83efaa555de415c8883c1bd644515ade7a422047eb6c1a7698eab594420e8b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		Learning Agents의 Manager는 등록된 오브젝트들을 Agent로 추적하고, `Add Agent` 노드로 학습 대상을 추가하는 구조.()

		- 컴파일 후 저

	### 2.2.2. [BP]Interactor 블루프린트 설정

		- LearningAgent 폴더에 Learning Agents Interactor 블루프린트 클래스 추가

			(이름 : BP_SpiderInteractor)


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/75708a0c-8901-4eeb-9a4b-d079a6cb319a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466VK47GAL2%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071841Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBRsGaIwkg1pFO3JbKx15JZoWDEiwe%2FqeTDpUJf8p1fGAiEAqRYL%2BOPn57UXkVQwruANaP1GKAYgcOLFxk5fCic83z4q%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDINMiymFTQMqu2dabircA4PouWdZ5Sn9OKShXLvIXxv8dMpO8EhSwGCwArAL%2B6INoO5Sqe1bJ%2BHPYQ5AzTlfyY%2B19ik%2F9%2FWhSnyov6EvvxEx%2BL2loMnbVIc0%2Fz3yd9P07F637XFHUzrD6qMFZuPQkTA3upcMl5TNQHRK1JiKmtfXzX%2Bjy6JgvFyZuw06v64P5sCOLevyKRoWfKYkaodcjbZmR9NblQhw4bxDGcfpcTN5m8TtUqDdcaS19nFsyRkBMPhxbid6sUayL9bGXQIqhLdDWVoZk2HRdAMRK1KzhTLvTLLs7pPfdR87BOhEqh1BISSw9%2F2PyTQ1g8kUIFlszPy5ZNgjgKK7IaumW8yEGq8QTfuICSV2Ka0eW1svEwQ7wBViPjF4ys3HyRkzGfYgjkxwhlwaW7qH8Ax8URSOChIOQ%2FfLAVdl2jWKy1OXVe5X5D7wmj0u4k46VGMKLcAz2o0CPRsOoiJp5mVLPp%2FDzcE8b1Dv%2FI1pafKXXQg7Erj698eZghIdkWjkrbURuskIWaFxBGcyq%2F3KRTfa7%2Bjt2Wl9YOM2OVTxE8OgPGSHuDS1yad31jvnxPLe6a2F6ZPUt%2FlH9UVk8ZDffIIDaJjtm2rvFGugjfvOR5z8CKs3xrxQfr86096dA37TzXr7MMmA1dAGOqUBEYJt1eJX%2BPTAYna3guqNm1HyDnCHVQdfPpWavhnrNomAcIEaSYGAZJUTRq7PxyEriV8EEzzUJ6bBJCJMw%2FcQI3UYmBtBLhJSNcoPrrsJk6YmYDVmedItuHr7ajBHCVHW6IHHXqmP0%2FVtEJVdAYdZTMbyBFTgzc%2BfxQOfl8%2FCMBu2DI7wFXrGGP8dpQlslsFsL09xaYz9eDkTeXzvOHRU63u7nc70&X-Amz-Signature=274373eb0504fee6519cc05cf48bc81de7dea2ae00ca82cc18d382513119e378&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- Interactor는 에이전트의 **Observation과 Action 구조를 정의하는 객체**

			이 클래스는 


			```c++
			거미 로봇의 현재 상태를 학습기에 전달
			학습기가 낸 행동값을 거미 관절 제어에 적용
			```


			를 수행한다.


	### 2.2.3. [BP]Interactor Observation / Action 함수 오버라이딩

		- 이제 이 인터액터 객체에 아래 4가지를 구현해야 한다

			(출처 : )


			```text
			1. Specify Agent Observation
			2. Specify Agent Action
			3. Gather Agent Observation
			4. Perform Agent Action
			```


			| 기능                          | 의미                         |
			| --------------------------- | -------------------------- |
			| `Specify Agent Observation` | 학습기에 어떤 입력값을 줄지 구조 정의      |
			| `Specify Agent Action`      | 학습기가 어떤 출력값을 낼지 구조 정의      |
			| `Gather Agent Observation`  | 매 순간 실제 거미 상태를 읽어서 입력값 채우기 |
			| `Perform Agent Action`      | 출력된 Action을 실제 관절 제어에 연결   |

		- 인터액터 더블 클릭 → override/재정의 드롭다운 으로 이동

			→ 기존 함수 재정의를 통해 특수한 에이전트 observation 을 재정의해야 한다


				()

		- `Override / 재정의`를 눌러서 아래 함수를 하나씩 추가

			```text
			Specify Agent Observation
			Specify Agent Action
			Gather Agent Observation
			Perform Agent Action
			```


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/0eb60d7c-1091-4e4a-a3c5-4c175232e434/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466W5EMGUO2%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071847Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCpwTuc4yoZKhN3lQvdE55S0JKkxB8Iv0kDNbatDL%2FuJgIgKeo2TLpjVf%2F08bNlG19bKmClp%2FxLnhamF7I7%2B6%2BKPaYq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDDe3VgJ2XM%2FmBv678yrcAzyz1fAzCdLEd9NG21OZd%2FdivMt0mhwu3ZYHqj94soD5SSwc9WSy8qvTCJ5B9Vt%2FgykZiU1Mu70m6cO4cXteI6%2BBuJc9AJMEgNAZA%2BL%2BJDzn1SKb4T1egHCR%2BmqyMlr4RWzASAVCH4nmk97LUF73vTd2Ww%2FxUXs%2FdpU1dA4mBGKf6NSezLBDcJBowTYQmrPq0vMaCiuEjJ2E90cWZ5lLW4zdJLXjIA4O%2BYfkccSs8Q7Xgj5%2B6U6mfxLlUvjGt4Zbfb0CyWqSUNM0LeaJ0xXh0koRuWxPBvKNLvMs%2BKllPUIo7A89SVp3ip04M66iiZbWffkLNun4o34FzxtY9oXl0lqfEsqX%2FBnTsdxiKTpSE46vRWLfhPiIBzSrfHgYhwNYThYTie2gnmidAKLhDx9xKc0vzQnxgsqiQIFZIZpeu8IzPQ%2FVfOMhtVzM4pZZMKNvyCAwH9%2FCcKYpjILR8JOwGzJCmCayMHYmsDondoU4TQgAzEmSwv%2BnmIbvTZ%2F55rMBdjOR0d9w9ZGF8rfqDD1kxykbPqHevxF1okLIF%2BWOeWYwQCe%2F3qsRbVBl4%2F7j%2Binu5itEOVQQ8UeQlXKMb48HGcxKEAuqvXLd6vTktojQ60hHCeo%2BgEu8lLkMeBWWMNOJ1dAGOqUBv1Ka3GI1WO%2Bl4%2FeYRxLFvYfX3QDMQUcc5gytJdRbZofivYgwmNn5edfFSXgLA5bfYbEgEdOQ8isHUaR9BmPPNm8FazrBiB%2BGnthvsJVtm7rBXddP831OpIbuyFlPwhRL%2B0bgvlu37FGN2L%2FWyJZT%2BzGdW0gymSxVwxAemLBtT45wWiZmqz6AgXINy%2BTGb%2Bmrxs3DKrO1sFpZ3vhjRghVbXEslFkq&X-Amz-Signature=8588c1798120f6e76ed0701ab19082200ac654583c8baca7b7baa8d886acb362&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


	### 2.2.4. [BP]관절 제어를 위한 Action 구조 설계

		- 이제 우리가 처음으로 학습시키려는 건

			> **학습기가 각 관절을 움직일 목표값을 출력하도록 만드는 것**


			이니까, `Specify Agent Action`에서 **연속값 Action을 관절 수만큼 선언해야 한다.**


			→ 현재 다리가 6개에 1개의 다리당 관절이 4개 있으니 총…24개의 Action를 선언해야한다

		- 따라서 `BP_SpiderInteractor`의 `Specify Agent Action`에서는**24차원의 연속 Action**을 정의한 이후, 각 Action 값은 이후 아래와 같이 실제 관절 제어값으로 매핑을 수행해야 한다

			```c++
			Action[0]  → 1번 관절 목표값
			Action[1]  → 2번 관절 목표값
			...
			Action[23] → 24번 관절 목표값
			```

		- 현재 SpiderJointControllerComponent 는 특정 Constraint 1개를 테스트 제어하는 구조이므로,이후에는 **24개 Constraint를 배열로 관리하고, 24개 Action을 각각의 관절 목표 회전값으로 반영할 수 있도록 확장해야 한다.**

	### 2.2.5. [BP]Continuous Action 정의


		**Specify Continuous Action**은 강화학습(Reinforcement Learning)에서 나오는 개념으로, **연속적인 행동 공간(Continuous Action Space)**을 정의하는 것이다.


		### 핵심 개념


		강화학습에서 에이전트의 행동(Action)은 두 가지로 나뉘어짐


		| 구분                    | 설명                | 예시               |
		| --------------------- | ----------------- | ---------------- |
		| **Discrete Action**   | 정해진 선택지 중 하나      | 좌/우/점프 버튼        |
		| **Continuous Action** | 실수 범위 내 어떤 값이든 가능 | 핸들 각도 -1.0 ~ 1.0 |


		### Continuous Action이 필요한 이유


		로봇 팔 제어, 자율주행, 물리 시뮬레이션처럼 **세밀한 조작**이 필요한 환경에서는 "왼쪽 버튼 누름" 같은 이산적 행동으론 부족하고,대신 "관절을 정확히 37.5도 회전"처럼 연속적인 값이 필요하기 때문이다


		현재 여기서의 우리의 목표는 학습을 진행하는 것이 아닌,


		> **Learning Agents가 낸 행동값 24개가  
		> 실제 6족 거미 로봇의 24개 관절 제어로 정확히 들어가고,  
		> 거미 로봇의 상태가 다시 Learning Agents의 관찰값으로 돌아오는  
		> “입출력 통로”를 완성하는 것**


		을 확인하는 것이다. 즉 상태→Action 루프가 정상적으로 돌아가는 지 확인하는 것 


		```c++
		거미 로봇 상태
		→ Observation
		→ Learning Agents Policy
		→ Action 24개
		→ 관절 제어
		→ 거미 로봇 상태 변화
		```

		- `BP_SpiderInteractor`가 바로 이 **입출력 통로** 역할을 한다. Epic도 Interactor를 “관찰값과 행동값을 통해 에이전트가 환경과 상호작용하는 방식을 정의하는 클래스”로 설명하고 있다()
		따

		### 따라서 전체 구조의 틀은….


		```c++
		BP_SpiderTrainingManager
		└─ Learning Agents Manager
		   └─ 거미 로봇을 Agent로 등록
		
		BP_SpiderInteractor
		├─ Observation 구조 정의
		├─ Action 구조 정의
		├─ 거미 상태 읽기
		└─ 학습기 Action을 로봇으로 전달
		
		BP_SpiderRobot
		└─ SpiderJointControllerComponent
		   ├─ 24개 관절 Constraint 관리
		   ├─ 24개 Action을 실제 목표 각도로 변환
		   └─ 관절 상태를 Observation용으로 제공
		```


		라고 보면 된다.


		### 세부 항목에 대한 설명


			이미 만든 `BP_SpiderTrainingManager`는:


			```text
			- 맵에서 거미 로봇 찾기
			- Agent 등록
			- 이후 Interactor / Trainer / Recorder 연결
			```


			을 담당한다.


			여기에는 **관절 제어 로직을 넣지 않는 게 맞아.**


			왜냐하면 `TrainingManager`는


			“누구를 학습시킬지”와 “어떤 학습 프로세스를 붙일지”만 관리하는 상위 오브젝트여야,


			나중에:

			- PPO 학습
			- Imitation Learning
			- 기록용 Recorder

			를 바꿔 끼우기 쉬워지기 때문이야.


			---


			Interactor에서는 두 가지를 정한다.


			학습기가 **무엇을 볼 것인가**


			예:


			```text
			- 몸체 Pitch / Roll
			- 몸체 높이
			- 각 관절 각도
			- 각 관절 각속도
			- 몸체 속도
			```


			학습기가 **무엇을 출력할 것인가**


			현재 기준:


			```text
			- 24개 관절 목표 제어값
			```


			즉, Interactor는:


			```text
			학습기 입력 형식
			학습기 출력 형식
			```


			을 확정하는 곳이야. Epic 문서도 `SpecifyAgentObservation`, `SpecifyAgentAction`이 정책 입출력 구조를 정의하고, `GatherAgentObservation`, `PerformAgentAction`이 실제 수집과 적용을 담당한다고 설명한다.


			---


			이건 우리가 이미 C++로 만든 컴포넌트야.


			현재는:


			```text
			Constraint 1개를 찾아서
			Sin 파형으로 흔들어보는 테스트 구조
			```


			였지.


			이걸 앞으로는:


			```text
			24개 Constraint를 배열로 관리
			→ Action[0] ~ Action[23]을 입력받음
			→ 각 관절의 목표 회전값으로 변환
			→ Physics Constraint motor에 적용
			```


			하는 구조로 확장해야 해.


			그렇게 하면 금방 꼬여.

			- 24개 관절 이름 관리
			- 각 관절별 축 방향 차이
			- Action 값을 실제 각도로 변환
			- 관절 제한 범위
			- 물리 모터 파라미터

			이런 것들은 **C++ 컴포넌트가 맡는 게 훨씬 안정적**이야.


			Interactor는 그냥:


			```text
			24개 Action을 받아서
			JointController에 넘긴다
			```


			까지만 하면 돼.


			---


			```text
			Learning Agents
			→ BP_SpiderInteractor
			→ Perform Agent Action
			→ 24개 Action 값 추출
			→ SpiderJointControllerComponent::ApplyJointActions(...)
			→ 24개 Constraint 목표 회전 갱신
			```


			학습기는 관절 이름이나 물리 Constraint를 알 필요가 없어.


			그냥 **24차원 행동 벡터**만 내면 돼.


			관절별 해석은 로봇 전용 제어기에서 담당해야


			학습 방식이 PPO든, Imitation이든, 나중에 SAC 외부 연동이든 재사용 가능해진다.


			---


			```text
			BP_SpiderRobot / JointController
			→ 현재 몸체 자세, 관절 상태 읽기
			→ BP_SpiderInteractor
			→ Gather Agent Observation
			→ Learning Agents에 Observation 전달
			```


			학습기는 로봇 상태를 보고 행동을 내야 하니까,


			현재 로봇의:

			- 중심 몸체 상태
			- 관절 상태

			를 정리해서 Observation으로 받아야 한다.


			---


			이걸 먼저 잡는 이유가 바로 여기 있어.


			우리가 앞에서 이야기한 것처럼,


			걷는 애니메이션이나 시연 데이터를 활용하는 **Imitation Learning**을 쓸 가능성이 높잖아.


			그런데 Epic의 Recorder도 **Interactor를 기준으로 Observation과 Action을 기록**한다. 즉, 시연 데이터를 녹화하려면 지금 만드는 이 입출력 구조가 먼저 필요하다.


			정리하면:


			```text
			Interactor + JointController 연동
			```


			은

			- PPO 학습에도 필요
			- Imitation Learning에도 필요
			- 시연 데이터 Recorder에도 필요

			한 **공통 기반 공사**야.


			그래서 지금 당장 Trainer를 고르는 것보다


			**이 입출력 연동을 먼저 완성하는 게 맞다.**

		- Specify Agent Action 함수 그래프 창에 Specify Continuous Action 노드 추가

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/88390171-2605-463c-acf7-cae0d87170fc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SC463OZC%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071852Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCZGvDTh8Xw7%2BJ9IhB7UjqZ1cAJpXAQr5bEDZqZSz5HwgIhAOtdEN4rp6AMNSxtQ%2B8Ykv%2Fc7%2FVlBQM9G4ko5mfYJ87%2BKv8DCHgQABoMNjM3NDIzMTgzODA1Igw%2BpaWzkBdS%2ByM32nEq3AMHmPBRzMQ2jUKDV9J4Lkx8LXIjHiy6nA8FLFYIskj4zc3LrIqXdwAER1lJ8gmvUDLWTvXpbd9OCKLaXNCgoiLksp6M86l5DJ%2FWHfLyad8lwuehvbUV5xkvn4MwmIaz%2FRmhluZy4cJGTQj4TDqLCLrORb0Zolcz0u2SGIW4a6X2lffYpi7IW8EGNYptNpg6qzSnm44niyaGvtxjZOLUCcX5MeKM%2FxndRaR2wnc7AFdrtYlstOBodRV1VYP0JkfsJdtMZ10c5CoovgNr0i4QmXxB60aUruUMA%2B5ruJnIvK8uil%2BfTGJ2gr39DL%2BqtsrhvCDXm6LD%2BDaidXUw5TYKT%2FIwY36T9DLTe%2FqyrXw8THx4C6WMnGaex%2BNvPXHVCaJRDRQRJmaR2QHMrFcInBFkJtsUndoMCjll1Wd4hKNEBd86k9iLMoXfu5WoKKiGvbEnQbMJ%2BNbztssmaVsZTvJkmea%2BLZNSJczJaf5oqzKPUn2syGOMsE%2FPQtRPkmThxp1qJijadV6nFszRkG%2F7C6zf4vRvKtJJ2ALkdKxy6hMFPaZXFMtZTubfxj2lE0KEFRw7OJBxZJ7luAb8sCt3LVTY4kjzvF77rxKtKxgg3mgi2zUvwvPdVxAccXRC2fbqqDC6gtXQBjqkAWf%2FTsSemPxwdPS0cG7qThTg2VsVGn14HuN8ZpK6erU5cIa5BNyp9pGdxhaPwa3Tm%2FeMBOTsJuLVl33%2Ftb50uWxqCoGIaeT01uCfo5DYujtIQdaZYPylKVrBeRJC1PUnMxMCPxJfyF%2FKeE0q43esbZH4tAYGTE73iJEtlTI4cFgob2frMDPESPtv1YxPU2miB6IznOxGAXZ8czM66e1tVDfKhW19&X-Amz-Signature=47bbf77a54cd1eda9365d7cc3da54ad01404fecc53acd7669627ffa45162a8af&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/823ffbaa-8cfc-4f88-aa59-dd3190e551be/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SC463OZC%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071852Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCZGvDTh8Xw7%2BJ9IhB7UjqZ1cAJpXAQr5bEDZqZSz5HwgIhAOtdEN4rp6AMNSxtQ%2B8Ykv%2Fc7%2FVlBQM9G4ko5mfYJ87%2BKv8DCHgQABoMNjM3NDIzMTgzODA1Igw%2BpaWzkBdS%2ByM32nEq3AMHmPBRzMQ2jUKDV9J4Lkx8LXIjHiy6nA8FLFYIskj4zc3LrIqXdwAER1lJ8gmvUDLWTvXpbd9OCKLaXNCgoiLksp6M86l5DJ%2FWHfLyad8lwuehvbUV5xkvn4MwmIaz%2FRmhluZy4cJGTQj4TDqLCLrORb0Zolcz0u2SGIW4a6X2lffYpi7IW8EGNYptNpg6qzSnm44niyaGvtxjZOLUCcX5MeKM%2FxndRaR2wnc7AFdrtYlstOBodRV1VYP0JkfsJdtMZ10c5CoovgNr0i4QmXxB60aUruUMA%2B5ruJnIvK8uil%2BfTGJ2gr39DL%2BqtsrhvCDXm6LD%2BDaidXUw5TYKT%2FIwY36T9DLTe%2FqyrXw8THx4C6WMnGaex%2BNvPXHVCaJRDRQRJmaR2QHMrFcInBFkJtsUndoMCjll1Wd4hKNEBd86k9iLMoXfu5WoKKiGvbEnQbMJ%2BNbztssmaVsZTvJkmea%2BLZNSJczJaf5oqzKPUn2syGOMsE%2FPQtRPkmThxp1qJijadV6nFszRkG%2F7C6zf4vRvKtJJ2ALkdKxy6hMFPaZXFMtZTubfxj2lE0KEFRw7OJBxZJ7luAb8sCt3LVTY4kjzvF77rxKtKxgg3mgi2zUvwvPdVxAccXRC2fbqqDC6gtXQBjqkAWf%2FTsSemPxwdPS0cG7qThTg2VsVGn14HuN8ZpK6erU5cIa5BNyp9pGdxhaPwa3Tm%2FeMBOTsJuLVl33%2Ftb50uWxqCoGIaeT01uCfo5DYujtIQdaZYPylKVrBeRJC1PUnMxMCPxJfyF%2FKeE0q43esbZH4tAYGTE73iJEtlTI4cFgob2frMDPESPtv1YxPU2miB6IznOxGAXZ8czM66e1tVDfKhW19&X-Amz-Signature=8dfca556b5fe10e7ec574513dcf2c407b4568e2c55aa0753715600488e46e908&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 이제 해당 노드에 값을 채워넣어 보자

			**여기서는 **`**Specify Continuous Action**`** 노드를 기존 함수 흐름에 “끼워 넣는” 게 아니라,**


			이 함수가 반환해야 하는 **Action Schema Element를 이 노드로 만들어서 **`**Return Node**`**에 넘겨야 함**


				거미 로봇의 관절 제어는 버튼처럼


				```text
				앞으로 가기
				뒤로 가기
				점프
				```


				이런 이산 행동이 아닌 연속적인 실수값 필요


				```text
				관절 0 = 0.25
				관절 1 = -0.71
				관절 2 = 0.13
				...
				```


				그래서 `Discrete Action`이 아니라 **Continuous Action**을 써서 연속값을 받아야 함.


				즉, 이 노드는“학습기는 실수값 Action 벡터를 출력한다”라고 선언하는 역할


			---


	### 2.2.6. [BP]Specify Continuous Action 핀 연결 및 값 설정


		### 1. `In Action Schema` → `Specify Continuous Action.Schema`


		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/2d26e129-4472-41a8-baa5-ae98b6e5da33/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WEFTDKHH%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071852Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDm7vmKlDaNB8yG3gyN2b%2BYtH3O5x3RTg8qQH9MCIwmtwIgeZF%2FT7%2FLZxskqeqX3ISmENSOWOl9JDaOaBL4cuXETQwq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDK6NTpOjAzavpxTkhCrcA5k15l8CkqTz5gaBlCoLC%2FESGFwTjiBZKJEOO55O7Jc5wZg8zsfXi%2B4gUUxQ6%2FKw25Vu1yJ%2FoJyuRk9dAzucX4xXtURbQF0mGgV140iL2TR1vIiqdK55hKx2DRygR1zOwo%2F235WjjqhbzPX4iwut7h%2FFk7qvfxMYlv77qQY8Zbze4OroFNOQ78mGjbI6Tc3boTzJAkTh%2Bee%2BzBADxslbEnHqDWfwpZgv9RSJlge3gj8pMpDwdnsjjID251fdagKcmg%2BpJDoVar22CxBEuzzIH1zLuhup4pTIZIIdl7n0aUO1tuYA9yBu1kZEjn7KLuF0hIP1%2BVMtCLrsJ0TnVN3bj0UHnddH%2BSmuc2bf7loFBZ0%2BVjsOPKJ3Er%2F7f8d%2BWkHNFOZmK2IHyU5NMXF6ho9r3ul0my4ODuf4BlWtPRV3qldDqYO8upEEU%2BxJGWmYXwzbuZHF0sTlSxH5sHwOCa8Pbsr6N9s%2B0P62OBiVSt%2FcKUTbZMUlN8PVxpyPi7Jw2gEr9vE1gyuEf5E4WlH6wlghi1kirhJjyPV6phyjALVdrpAqPNEosbLlJJB%2B3BUUTXQjAJTLdCtKwdvf3%2F1gkOmV2ZjcZzb7MXREzOa%2Fx0ZAbc06ieRmRZx2uFTjaLZtMPWB1dAGOqUBYgRTXq5YLOvGua7QTrvrghlChvyGHTO6ib3ihQ1kLi8wa2xt%2Fj%2FlUW%2BCgCVV5lwJ%2FwWmEBJpAtwoCqaDCU9%2BeNcFbqpPiXBdoXXfZrM6CHM%2BiYaQF%2Fw6B6P6%2F00Q5Q%2BjOCCrDTMf2wzrCnK2Qv%2F0WCgMWd5FBQSOQu7oqyliG2AddYHDyDM0MVLjg8PR9A9bvHFp5R17A6KMziUsW%2Bx5x3S9K2LZ&X-Amz-Signature=32eb03b89b7c5604a08acd22797b147019c70638f25d97ebff4cfe2f44300519&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- `In Action Schema`는 이 함수로 들어온 **Action 설계도 원본**

			`Specify Continuous Action`은 그 설계도 안에


			```text
			24개짜리 연속 Action 항목
			```


			을 추가하는 노드임

		- 그래서 이 In Action Schema 와Specify Continuous Action.Schema 를 연결해야 함

		`Specify Continuous Action`이 어느 Action Schema에 등록되어야 하는지 모르게 됨


		즉, 노드는 있어도 Learning Agents의 실제 Action 구조에 제대로 반영되지 않을 수 있음


		### 2. `Size = 24`


		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e4e32907-2f9a-4b52-9039-22ea59e4a10e/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WEFTDKHH%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071852Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDm7vmKlDaNB8yG3gyN2b%2BYtH3O5x3RTg8qQH9MCIwmtwIgeZF%2FT7%2FLZxskqeqX3ISmENSOWOl9JDaOaBL4cuXETQwq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDK6NTpOjAzavpxTkhCrcA5k15l8CkqTz5gaBlCoLC%2FESGFwTjiBZKJEOO55O7Jc5wZg8zsfXi%2B4gUUxQ6%2FKw25Vu1yJ%2FoJyuRk9dAzucX4xXtURbQF0mGgV140iL2TR1vIiqdK55hKx2DRygR1zOwo%2F235WjjqhbzPX4iwut7h%2FFk7qvfxMYlv77qQY8Zbze4OroFNOQ78mGjbI6Tc3boTzJAkTh%2Bee%2BzBADxslbEnHqDWfwpZgv9RSJlge3gj8pMpDwdnsjjID251fdagKcmg%2BpJDoVar22CxBEuzzIH1zLuhup4pTIZIIdl7n0aUO1tuYA9yBu1kZEjn7KLuF0hIP1%2BVMtCLrsJ0TnVN3bj0UHnddH%2BSmuc2bf7loFBZ0%2BVjsOPKJ3Er%2F7f8d%2BWkHNFOZmK2IHyU5NMXF6ho9r3ul0my4ODuf4BlWtPRV3qldDqYO8upEEU%2BxJGWmYXwzbuZHF0sTlSxH5sHwOCa8Pbsr6N9s%2B0P62OBiVSt%2FcKUTbZMUlN8PVxpyPi7Jw2gEr9vE1gyuEf5E4WlH6wlghi1kirhJjyPV6phyjALVdrpAqPNEosbLlJJB%2B3BUUTXQjAJTLdCtKwdvf3%2F1gkOmV2ZjcZzb7MXREzOa%2Fx0ZAbc06ieRmRZx2uFTjaLZtMPWB1dAGOqUBYgRTXq5YLOvGua7QTrvrghlChvyGHTO6ib3ihQ1kLi8wa2xt%2Fj%2FlUW%2BCgCVV5lwJ%2FwWmEBJpAtwoCqaDCU9%2BeNcFbqpPiXBdoXXfZrM6CHM%2BiYaQF%2Fw6B6P6%2F00Q5Q%2BjOCCrDTMf2wzrCnK2Qv%2F0WCgMWd5FBQSOQu7oqyliG2AddYHDyDM0MVLjg8PR9A9bvHFp5R17A6KMziUsW%2Bx5x3S9K2LZ&X-Amz-Signature=73847a78bc01ca1176b7315dfacdf7157fed291646bf7488fdd4f6e14fb55f85&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- `Size`는 **학습기가 한 번에 출력할 연속값 개수**

			우리 프로젝트에서는 24개 관절을 전부 제어할 거니까 Size = 24 로 둔다


		---


		### 3. `Scale = 1.0`

		- `Scale`은 Continuous Action 값의 기본 크기를 정하는 값. 쉽게 말하면 학습기가 출력하는 원시 Action 값을 어느 정도 크기로 볼 것인가에 가까움
		- 지금은 Learning Agents 쪽에서 Action을 일단 **정규화된 값**으로 받는 게 좋음

		```text
		Action 값: 대략 -1.0 ~ +1.0
		```

		- 그리고 실제 관절 각도 변환은 나중에 C++의 `SpiderJointControllerComponent`에서 처리.

			예를 들어 나중에 이렇게 변환 가능


			```text
			Action = -1.0 → -30도
			Action =  0.0 → 기준 자세
			Action = +1.0 → +30도
			```

		- 이렇게 역할을 나누면 구조가 깔끔해짐

			```text
			Interactor
			→ 학습 입출력 형식만 정의
			
			SpiderJointControllerComponent
			→ Action 값을 실제 관절 각도로 변환
			```

		- 예를 들어 `Scale = 30.0`처럼 크게 잡아버리면, 학습 초기에 랜덤 Action이 바로 큰 관절 움직임으로 들어가서 로봇이 심하게 튀거나 폭주할 수 있음
		- 그래서 처음에는:

			```text
			Scale = 1.0
			```


			으로 두고, 실제 관절 회전 범위는 제어 컴포넌트에서 안전하게 제한하는 게 좋음


		---


		### 4. `Return Value` → `Return Node.Out Action Schema Element`

		- `Specify Agent Action` 함수는 마지막에:

			```text
			이 에이전트의 Action 구조는 이것입니다
			```


			라고 반환해야 함

		- `Specify Continuous Action`의 `Return Value`가 바로:

			```text
			24개짜리 Continuous Action 구조
			```


			그 자체의 값

		- 그래서 이걸 `Return Node`의:

			```text
			Out Action Schema Element
			```


			에 꽂아야 함

		- 함수 안에서 Continuous Action을 만들어도, 함수가 그 구조를 반환하지 못해서,  나중에 Learning Agents가 Policy나 Trainer를 구성할 때 이 에이전트의 Action 구조가 뭔지 제대로 이어받지 못할 수 있음

		### 연결 완료 


		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/69685fb7-dbef-4c26-ad89-4f6825611d73/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466WEFTDKHH%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071853Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDm7vmKlDaNB8yG3gyN2b%2BYtH3O5x3RTg8qQH9MCIwmtwIgeZF%2FT7%2FLZxskqeqX3ISmENSOWOl9JDaOaBL4cuXETQwq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDK6NTpOjAzavpxTkhCrcA5k15l8CkqTz5gaBlCoLC%2FESGFwTjiBZKJEOO55O7Jc5wZg8zsfXi%2B4gUUxQ6%2FKw25Vu1yJ%2FoJyuRk9dAzucX4xXtURbQF0mGgV140iL2TR1vIiqdK55hKx2DRygR1zOwo%2F235WjjqhbzPX4iwut7h%2FFk7qvfxMYlv77qQY8Zbze4OroFNOQ78mGjbI6Tc3boTzJAkTh%2Bee%2BzBADxslbEnHqDWfwpZgv9RSJlge3gj8pMpDwdnsjjID251fdagKcmg%2BpJDoVar22CxBEuzzIH1zLuhup4pTIZIIdl7n0aUO1tuYA9yBu1kZEjn7KLuF0hIP1%2BVMtCLrsJ0TnVN3bj0UHnddH%2BSmuc2bf7loFBZ0%2BVjsOPKJ3Er%2F7f8d%2BWkHNFOZmK2IHyU5NMXF6ho9r3ul0my4ODuf4BlWtPRV3qldDqYO8upEEU%2BxJGWmYXwzbuZHF0sTlSxH5sHwOCa8Pbsr6N9s%2B0P62OBiVSt%2FcKUTbZMUlN8PVxpyPi7Jw2gEr9vE1gyuEf5E4WlH6wlghi1kirhJjyPV6phyjALVdrpAqPNEosbLlJJB%2B3BUUTXQjAJTLdCtKwdvf3%2F1gkOmV2ZjcZzb7MXREzOa%2Fx0ZAbc06ieRmRZx2uFTjaLZtMPWB1dAGOqUBYgRTXq5YLOvGua7QTrvrghlChvyGHTO6ib3ihQ1kLi8wa2xt%2Fj%2FlUW%2BCgCVV5lwJ%2FwWmEBJpAtwoCqaDCU9%2BeNcFbqpPiXBdoXXfZrM6CHM%2BiYaQF%2Fw6B6P6%2F00Q5Q%2BjOCCrDTMf2wzrCnK2Qv%2F0WCgMWd5FBQSOQu7oqyliG2AddYHDyDM0MVLjg8PR9A9bvHFp5R17A6KMziUsW%2Bx5x3S9K2LZ&X-Amz-Signature=bfb6be90f7508f078ad812763eefed0cab1aa64f7f8e0f85400a50625f111e6a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


	### 2.2.7. [BP] Perform Agent Action 연결 방향 정의

		- 지금은 “학습기가 24개 Action을 출력한다”는 **형식만 정의**한 상태고, 아직 그 24개 값이 실제 로봇 관절로 들어가지는 않는 상태임
		- 다음 작업의 목적은

			```text
			Learning Agents가 출력한 24개 Action
			→ BP_SpiderInteractor에서 꺼냄
			→ BP_SpiderRobot의 SpiderJointControllerComponent로 전달
			→ 24개 Constraint 목표 회전값 갱신
			```

		- 다만 여기서 바로 블루프린트만으로 끝낼 수는 없고, 기존 C++ 코드가 아직 **Constraint 1개만 제어하는 구조**라서 먼저 C++ 컴포넌트를 **24개 관절 배열 제어 구조**로 확장해야 함.
		- 즉 다음 순서는:

			```text
			1. SpiderJointControllerComponent를 24개 관절 제어용으로 수정
			2. BP_SpiderRobot에서 24개 Constraint 이름 배열 설정
			3. BP_SpiderInteractor.Perform Agent Action에서 24개 Action을 컨트롤러에 전달
			```


	### 2.2.8. [[C++] SpiderJointControllerComponent를 전체 관절 제어 구조로 확장

		- 24개 관절 Action 수신용으로 관절 컴포넌트를 수정하는 것이 목적

			```c++
			Learning Agents
			→ BP_SpiderInteractor
			→ Perform Agent Action
			→ SpiderJointControllerComponent.ApplyJointActions(24개 값)
			→ 24개 Physics Constraint 목표 회전 갱신
			```

		- 수정 구조

			```c++
			JointConfigs 배열 24개
			ResolvedConstraints 배열 24개
			
			Action[0]  → JointConfigs[0]  → Constraint[0]
			Action[1]  → JointConfigs[1]  → Constraint[1]
			...
			Action[23] → JointConfigs[23] → Constraint[23]
			```


			```c++
			#pragma once
			
			#include "CoreMinimal.h"
			#include "Components/ActorComponent.h"
			#include "SpiderJointControllerComponent.generated.h"
			
			class USkeletalMeshComponent;
			struct FConstraintInstance;
			
			USTRUCT(BlueprintType)
			struct FSpiderJointMotorConfig
			{
				GENERATED_BODY()
			
				// Physics Asset 안에서 제어할 Constraint 이름이다.
				// 코드에 관절 이름을 하드코딩하지 않고 BP_SpiderRobot에서 배열로 지정하기 위해 사용한다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FName ConstraintName = NAME_None;
			
				// Action 값이 0일 때의 기준 목표 회전이다.
				// 학습기가 아무 조작을 하지 않았을 때 관절이 유지할 기본 자세라고 보면 된다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FRotator BaseTargetOrientation = FRotator::ZeroRotator;
			
				// Action 값을 실제 회전 각도 변화로 바꾸는 스케일이다.
				// 예: ActionScale.Pitch = 30이면 Action +1.0이 Pitch +30도 의미가 된다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FRotator ActionScale = FRotator(30.0f, 0.0f, 0.0f);
			
				// 목표 자세를 따라가려는 위치 제어 강도다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float PositionStrength = 5000.0f;
			
				// 관절 속도 감쇠 강도다. 너무 낮으면 떨림이 커질 수 있다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float VelocityStrength = 500.0f;
			
				// 관절 모터가 낼 수 있는 최대 힘이다.
				// 0은 엔진 설정에 따라 무제한처럼 동작할 수 있으므로 처음에는 적당한 값으로 제한하는 편이 안전하다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float ForceLimit = 100000.0f;
			};
			
			UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
			class YOURPROJECT_API USpiderJointControllerComponent : public UActorComponent
			{
				GENERATED_BODY()
			
			public:
				USpiderJointControllerComponent();
			
			protected:
				virtual void BeginPlay() override;
			
			public:
				virtual void TickComponent(
					float DeltaTime,
					ELevelTick TickType,
					FActorComponentTickFunction* ThisTickFunction
				) override;
			
				// Learning Agents가 출력한 24개 Action 값을 실제 관절 목표 회전으로 적용하는 함수다.
				// Blueprint의 Perform Agent Action에서 호출할 수 있어야 하므로 BlueprintCallable로 연다.
				UFUNCTION(BlueprintCallable, Category = "Spider Joint")
				void ApplyJointActions(const TArray<float>& JointActions);
			
				// 현재 등록된 제어 관절 수를 반환한다.
				// 나중에 Action 개수 검증이나 디버그 출력에 사용한다.
				UFUNCTION(BlueprintPure, Category = "Spider Joint")
				int32 GetControlledJointCount() const;
			
			private:
				void InitializeControlledConstraints();
			
			protected:
				// 제어할 SkeletalMeshComponent를 직접 지정할 수 있다.
				// 비워두면 Owner에서 첫 번째 SkeletalMeshComponent를 자동으로 찾는다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TObjectPtr<USkeletalMeshComponent> TargetSkeletalMesh = nullptr;
			
				// 6족 거미 로봇의 제어 대상 관절 설정 배열이다.
				// 여기에는 24개 항목이 들어가는 것이 현재 목표다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TArray<FSpiderJointMotorConfig> JointConfigs;
			
			private:
				UPROPERTY()
				TObjectPtr<USkeletalMeshComponent> ResolvedSkeletalMesh = nullptr;
			
				// JointConfigs와 같은 순서로 매칭되는 실제 Constraint 포인터 배열이다.
				// Action[i]는 ResolvedConstraints[i]에 적용된다.
				TArray<FConstraintInstance*> ResolvedConstraints;
			};
			```

		- 이렇게 해두면 나중에 Blueprint에서 24개 관절을 등록할 때,

			```c++
			JointConfigs[0].ConstraintName = 어떤 관절
			JointConfigs[1].ConstraintName = 어떤 관절
			...
			JointConfigs[23].ConstraintName = 어떤 관절
			```


			로 관리 가능. 즉 코드에는 관절 이름이 하나도 안들어가고 학습 Action과 관절 매핑은 BP 설정 배열 순서로 결정

		- 이게 중요한 이유는 나중에
			- 관절 순서를 바꾸고 싶을 때
			- 특정 다리를 제외하고 싶을 때
			- 관절별 회전축이 다를 때
			- 6족에서 8족으로 바꾸고 싶을 때

			C++ 코드를 다시 뜯지 않고 설정만 바꾸면 되기 때문


			```c++
			#include "SpiderJointControllerComponent.h"
			
			#include "Components/SkeletalMeshComponent.h"
			#include "PhysicsEngine/ConstraintInstance.h"
			
			USpiderJointControllerComponent::USpiderJointControllerComponent()
			{
				// Learning Agents가 Perform Agent Action 단계에서 직접 ApplyJointActions를 호출할 예정이므로,
				// 이 컴포넌트 자체 Tick은 반드시 필요하지 않다.
				// 관절 목표값은 Action이 들어올 때마다 갱신된다.
				PrimaryComponentTick.bCanEverTick = false;
			}
			
			void USpiderJointControllerComponent::BeginPlay()
			{
				Super::BeginPlay();
			
				InitializeControlledConstraints();
			}
			
			void USpiderJointControllerComponent::TickComponent(
				float DeltaTime,
				ELevelTick TickType,
				FActorComponentTickFunction* ThisTickFunction
			)
			{
				Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
			
				// 현재 구조에서는 Tick에서 자동 진동을 만들지 않는다.
				// 관절 제어는 Learning Agents Action 또는 외부 디버그 함수가 ApplyJointActions를 호출할 때 수행한다.
			}
			
			void USpiderJointControllerComponent::InitializeControlledConstraints()
			{
				ResolvedConstraints.Reset();
			
				// 1. 제어할 SkeletalMeshComponent 결정
				//
				// TargetSkeletalMesh를 BP에서 직접 지정했다면 그걸 우선 사용한다.
				// 비워두었다면 Owner Actor 안에서 첫 번째 SkeletalMeshComponent를 자동으로 찾는다.
				if (TargetSkeletalMesh != nullptr)
				{
					ResolvedSkeletalMesh = TargetSkeletalMesh;
				}
				else if (GetOwner() != nullptr)
				{
					ResolvedSkeletalMesh = GetOwner()->FindComponentByClass<USkeletalMeshComponent>();
				}
			
				if (ResolvedSkeletalMesh == nullptr)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] SkeletalMeshComponent를 찾지 못했습니다.")
					);
					return;
				}
			
				if (JointConfigs.Num() == 0)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] JointConfigs가 비어 있습니다. 제어할 Constraint를 BP에서 등록해야 합니다.")
					);
					return;
				}
			
				ResolvedConstraints.Reserve(JointConfigs.Num());
			
				// 2. JointConfigs에 등록된 Constraint들을 실제 Physics Asset에서 찾는다.
				//
				// 중요한 점:
				// ResolvedConstraints 배열은 JointConfigs와 같은 순서를 유지한다.
				// 따라서 Action[i]는 JointConfigs[i] / ResolvedConstraints[i]에 대응한다.
				for (int32 Index = 0; Index < JointConfigs.Num(); ++Index)
				{
					const FSpiderJointMotorConfig& Config = JointConfigs[Index];
			
					if (Config.ConstraintName.IsNone())
					{
						UE_LOG(
							LogTemp,
							Warning,
							TEXT("[SpiderJointController] JointConfigs[%d]의 ConstraintName이 비어 있습니다."),
							Index
						);
			
						ResolvedConstraints.Add(nullptr);
						continue;
					}
			
					FConstraintInstance* Constraint = ResolvedSkeletalMesh->FindConstraintInstance(Config.ConstraintName);
			
					if (Constraint == nullptr)
					{
						UE_LOG(
							LogTemp,
							Warning,
							TEXT("[SpiderJointController] Constraint '%s'를 찾지 못했습니다. Index=%d"),
							*Config.ConstraintName.ToString(),
							Index
						);
			
						ResolvedConstraints.Add(nullptr);
						continue;
					}
			
					// 3. 각 Constraint의 Angular Motor 설정
					//
					// SLERP 모드는 목표 회전 Quaternion을 향해 관절을 움직이게 하는 방식이다.
					// 현재는 학습기가 직접 토크를 내는 구조가 아니라,
					// 목표 자세를 출력하고 Physics Constraint Motor가 그 자세를 추종하는 구조다.
					Constraint->SetAngularDriveMode(EAngularDriveMode::SLERP);
					Constraint->SetOrientationDriveSLERP(true);
			
					// PositionStrength:
					// 목표 회전에 얼마나 강하게 따라갈지 결정한다.
					//
					// VelocityStrength:
					// 움직임의 감쇠 성격이다. 너무 낮으면 떨림이 커질 수 있고,
					// 너무 높으면 반응이 둔해질 수 있다.
					//
					// ForceLimit:
					// 모터가 낼 수 있는 최대 힘이다.
					// 너무 크면 학습 초기 랜덤 Action에서 로봇이 과하게 튈 수 있고,
					// 너무 작으면 관절이 목표값을 따라가지 못한다.
					Constraint->SetAngularDriveParams(
						Config.PositionStrength,
						Config.VelocityStrength,
						Config.ForceLimit
					);
			
					// Action 값이 0일 때의 기준 자세를 먼저 적용한다.
					Constraint->SetAngularOrientationTarget(
						Config.BaseTargetOrientation.Quaternion()
					);
			
					ResolvedConstraints.Add(Constraint);
			
					UE_LOG(
						LogTemp,
						Log,
						TEXT("[SpiderJointController] Joint[%d] Constraint '%s' 초기화 완료."),
						Index,
						*Config.ConstraintName.ToString()
					);
				}
			
				UE_LOG(
					LogTemp,
					Log,
					TEXT("[SpiderJointController] 제어 관절 초기화 완료. JointConfigs=%d, ResolvedConstraints=%d"),
					JointConfigs.Num(),
					ResolvedConstraints.Num()
				);
			}
			
			void USpiderJointControllerComponent::ApplyJointActions(const TArray<float>& JointActions)
			{
				// 아직 Constraint 초기화가 안 된 상태라면 한 번 시도한다.
				// BeginPlay 순서나 BP 호출 순서 문제로 ResolvedConstraints가 비어 있을 수 있기 때문이다.
				if (ResolvedConstraints.Num() == 0)
				{
					InitializeControlledConstraints();
				}
			
				if (JointConfigs.Num() == 0 || ResolvedConstraints.Num() == 0)
				{
					return;
				}
			
				if (JointActions.Num() != JointConfigs.Num() && !bLoggedActionCountMismatch)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] Action 개수와 JointConfigs 개수가 다릅니다. Actions=%d, JointConfigs=%d"),
						JointActions.Num(),
						JointConfigs.Num()
					);
			
					bLoggedActionCountMismatch = true;
				}
			
				// Action 개수가 다르더라도 가능한 범위까지만 적용한다.
				// 이렇게 하면 테스트 중 일부 Action만 들어와도 에디터가 멈추지 않고 동작을 확인할 수 있다.
				const int32 ApplyCount = FMath::Min3(
					JointActions.Num(),
					JointConfigs.Num(),
					ResolvedConstraints.Num()
				);
			
				for (int32 Index = 0; Index < ApplyCount; ++Index)
				{
					FConstraintInstance* Constraint = ResolvedConstraints[Index];
			
					if (Constraint == nullptr)
					{
						continue;
					}
			
					const FSpiderJointMotorConfig& Config = JointConfigs[Index];
			
					// Learning Agents의 Continuous Action은 기본적으로 정규화된 제어값으로 사용할 것이다.
					// 따라서 여기서는 안전하게 -1.0 ~ +1.0 범위로 제한한다.
					//
					// 왜 Clamp를 하냐?
					// 학습 초기에는 랜덤 정책이 예상보다 큰 값을 만들 수 있다.
					// 이 값을 그대로 각도에 곱하면 관절이 과도하게 꺾이거나 물리 폭주가 날 수 있다.
					const float ActionValue = FMath::Clamp(JointActions[Index], -1.0f, 1.0f);
			
					// ActionValue 하나를 관절 하나의 목표 회전 변화량으로 변환한다.
					//
					// BaseTargetOrientation:
					//   Action이 0일 때의 기준 자세
					//
					// ActionScale:
					//   Action -1~+1을 Pitch/Yaw/Roll 각도 변화로 바꾸는 스케일
					//
					// 예:
					//   BaseTargetOrientation = (0, 0, 0)
					//   ActionScale.Pitch = 30
					//   ActionValue = 1
					//   → Pitch +30도 목표
					FRotator TargetOrientation = Config.BaseTargetOrientation;
					TargetOrientation.Pitch += Config.ActionScale.Pitch * ActionValue;
					TargetOrientation.Yaw += Config.ActionScale.Yaw * ActionValue;
					TargetOrientation.Roll += Config.ActionScale.Roll * ActionValue;
			
					Constraint->SetAngularOrientationTarget(
						TargetOrientation.Quaternion()
					);
				}
			}
			
			int32 USpiderJointControllerComponent::GetControlledJointCount() const
			{
				// Learning Agents의 Action Size와 비교할 기준값으로 사용한다.
				// 현재 설계에서는 JointConfigs 항목 수가 곧 제어 채널 수다.
				return JointConfigs.Num();
			}
			```


		<details>
		  <summary>코드 설명</summary>
		
		
		1. `JointConfigs`
		
		- 이 배열이 이제 **관절 제어 설정표**
		
			```text
			JointConfigs[0] → Action[0]
			JointConfigs[1] → Action[1]
			...
			JointConfigs[23] → Action[23]
			```
		
		- 왜 배열로 하냐면, 관절 이름을 C++에 박아두면 모델이 바뀔 때마다 코드를 다시 수정해야 하기 때문
		- 배열로 두면 `BP_SpiderRobot`에서 설정만 바꾸면 된다.
		1. `InitializeControlledConstraints()`
		
		---
		
		- 이 함수는 `JointConfigs`에 적힌 Constraint 이름을 실제 Physics Asset에서 찾아서 `ResolvedConstraints`에 저장
		- 왜 저장하냐면, 매 프레임마다 이름으로 Constraint를 찾으면 비효율적이기 때문에, 처음 한 번 찾아두고, 이후에는 포인터 배열로 바로 접근하도록 함
		1. `ApplyJointActions()`
			- 이게 Learning Agents와 연결될 핵심 함수
			- 나중에 `BP_SpiderInteractor`의 `Perform Agent Action`에서 24개 Action 값을 꺼낸 뒤, 이 함수에 전달
		
				```text
				Learning Agents Action[24]
				→ ApplyJointActions
				→ 각 Constraint 목표 회전 갱신
				```
		
		
		---
		
		
		
		  </details>

		- 저장 후 빌드

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e13be628-ca19-4e98-9faf-71d3f71691f1/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466VTB5QVCT%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071902Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCrd%2Fl5jsKHfq0nnxDc%2BUvAD%2B21bmniZC6WmT8pgxlyLwIgdZf9x6NJVAVh1%2BhdAhgqhyGAV8hSDZbBEA9OMipdDocq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDND0onoQ6P2Tm0rT5ircA8xBuxe11VKN9cAKdMcJTY1TJ0MZjl4%2BiWXOAGUtFJ3X2eV2e66uILstFNxag056FGmOUVnRBb%2B0oxMVlMgbC%2FHcuWsigX0Lgl1QUpU7O%2FrDuthzsNa4IPKyqac3GgL0StQmf5ksUli9gTQeceX%2BvEAW9TT07me5KrSWz0FpGraaX8UxXpJl2oVs0VW79jswRQfA7iFjN5fvDdq0BZXAWQsqZhC%2BC6hOe0qO7h8qw5%2FmMl8nF2Tip7UVXB03VdHkVeDb%2FpDNIotIc%2FaDO9rLxWIgqnSpMcVr3kvQbhl5pIYc1shahQ2g4xS7Kgs49CKfIZ%2FQyVyWhE7BbKXSt5Tj9W5lal9GITVZXjmnRIn%2B0no%2Fkv8lPMri8hFYfS88%2BEJOq0eN9m7dhTC3rEVhz87%2BoM0LQeK8oITfOvbHfTq%2BDxz0zBNLIm5I%2FieglqACufEGVAk6GuDc8ibt8ES4rErVsyR9esa9plUYKME7vn1HGawg3aFf3sW3nm%2B%2F7cDK0%2BWUQVjgeBUgCydWySbugGfEk%2BtkG91iFGstpILsoyvanwY4Xr%2FDiasEvxWyOY8Wzl%2Bx8aS%2BsuzJxKj173K1dq%2BisDvcR7n2WstaBWyKgdHDjbgjWkuLN6IOf2ZKlxnVMJGA1dAGOqUB0WbWtm4fBO3PsT3kABNe%2FRiG4I4kGBDoCDdPW8JtyzqbaSLxPiCQLub9CABjjvec55pZcjMOlyXTApkSSzM5qFt%2B1MpZprONzae78pR6n9%2Fbw1hYU7G40TR0PG2S0sRfMgW3J3j6IXkdsolUMk%2F40UcV0TtU89fojhMt94s%2FSVh56ZMd19nUcfUb%2ButvQMDWDUgGqWL0XaMYL66R4b4UCrmndYcr&X-Amz-Signature=68aab73241db1626157752e23d6268ae118ea2bf089db60ecc853e6d1f91a40e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


	### 2.2.9. BP_SpiderRobot 내부 JointConfigs 직접 설정 방식의 문제점

		- 우리가 C++에서 만든 구조는

			```c++
			TArray<FSpiderJointMotorConfig>JointConfigs;
			```

		- 이 배열은 **학습 Action 24개가 어떤 실제 Physics Constraint에 연결될지 정하는 매핑표다.**

			```text
			Action[0]  → JointConfigs[0]  → Constraint 0
			Action[1]  → JointConfigs[1]  → Constraint 1
			...
			Action[23] → JointConfigs[23] → Constraint 23
			```

		- 이 배열을 채우지 않으면, Learning Agents가 24개 Action을 출력해도 C++ 컴포넌트는 **어떤 관절을 움직여야 하는지 모름**

		---

		- BP_SpiderRobot 더블클릭 → 왼쪽 컴포넌트 목록에서 우리가 생성한 SpiderJointController 선택

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/3a9d97fb-694f-4051-a477-ffd994db2f14/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466VYHIK6DO%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071903Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIHdtvUGJvX1bxWZT8Un9jjI9%2BTu1ekiBR9a2AQuIVSMpAiAqfJWOIzhhfONlB6OrSykGNi6ykUOH%2FVWf3r6S0vT%2ByCr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMDBfcehkJcukJLLiSKtwDRYUd0o4l%2BfrttRanW02rBVoq684qlGKssy0uShO3x9yMrhuYLAaFRqU3daFasi01ffXrb041%2BSqxPBTiMPcUGcCsrV%2FE73jQpTP3eP9AIRQoq6zjHC%2BG0ztnMYJAxnfDytcq0zwVT3ltS9qZLG9lwZ%2FftZUAonKawVu5ydzK6%2FD1Yyhn1DiMAvY0h1AdlQrgZcDfYkvLdkRt8OfNXLrZgm2lSO5c8Z9SI0a3DdDKEH4zCrMMq8Z7UqXJy%2FR0drrod%2BuK0i0oSLwskr9tSQbc3Bx0aMUfI0SGPbSCcCjYxAIMA1uw6rTugC7Sn9t2Rb1EfUKhVldAawOhwBzqGqG3DyUMlWpd1dJI3I2htyPGi5uH97aUHln5bc52Z1ZRTRgfwucRZdkY%2BSAoSVLODRwMj4iqe%2F72M4q8nubxOm0Z1KxOGeAPEHSjzb0zroOnJIn62iWycyG67gCXR9Fg8lBYFsDA%2FumnhVG5Wh6eOO0fIyQYn%2BqfQG%2F4TbJNSXjYDq%2BE5l591ibKoHtWQIgODUKAdgXHrRQ7BWiplTz9DiZFKuwTd5upGY4Ach6YOaeN%2B0xAwPWuIXlFkmmbAW8F%2BlX9E3ECaZYeCY%2F%2Bghm37OxHPLipMf6GDxBI6%2Fk2RjkwuoLV0AY6pgGn72BR13f5uXJGxI4ylZ52b0pBHlCExhCtjNLXAHpNsEwZCcwKiwx7qgkJpXHtMyQroAHEpFV7N7eqdk3fwbOe0MlDrR4%2Bw2Du1QDNP0UcJxXxbFpVeOKsPZdoR3WrxQKg%2BBmxsCEHX4LGqtTDr%2F0w9QzNq9bBD2uLsbtEhR0JyJNYtWScax%2BjOFjS9IjvvNd%2F9RvY50gT1sn2OAY%2BykzfuGIhNlUI&X-Amz-Signature=37e772a40844756b6e72d0e9ef5deb1575031728628092eb6f825b040a6b7e8c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 우리가 코드로 추가한 항목들 보이는지 확인

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/2f3f57b1-dfa3-48e8-9031-bd5e153bf438/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SBAYW5NR%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071903Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIHqHEKYdQR9Kp3iJHI4vLRx%2FzS7QD%2FPONeC7YeflRlIwAiAiVsRt8C1jjDWRM7tlA%2FRW8QcfL5Q0OI4Tes1Elv1hUir%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIM2XsEYLwq3OD6a3ptKtwDtFNeTTuFUz1uDxrZKxXIKRKbD26LbHvExAWkzZbFf1Tzc4F34VDqsVIQtTshBSgA0syvE3wHMOOjY9bexwur3DqnqMfdYVpNe%2BObHXxE6GVVsA%2FdFLbcVvl5OCnrmdyHegryODQhULnMJczqohgDBCF3L%2BrSYRLTvQoJTh814IYVGOr%2BsByXC1zM%2FTf%2F3QdevtvJAmBJ5J6%2FaaiXcEcNvvJhh00pyuiCd9AOLJeNVazI6z8bhmmwnynjuRw5o35S6IJ8QODKjQnTrPh9h5GFG3pnu5NcJ%2FTGWhfTBF0QCEUt5uoJkMCZ6fwL5F5hT5pQs5O6sA5HSRyfgSnu5AQ9dICsZrp3qDZOhEk%2FWGQm1%2B1BcQZAJBtn29DxM9lFuTD8VaNMyMocxMHbBidfNEiP7HFFCaa%2FEWVZFhXvTRhKmLFdlGQyqGSxw6CURvJRul%2BAsPZQMn3oR1SbBtrzc0BDNbYX6TEKJe2%2BSflFYEsxWShwIGz9WjF4kAFNX65nT83A54%2FG9XWQSLgU%2BARRJTBIqTAC5QZK6%2B2oGBc9Gg9LV4dJ4aO2V4VKySS1IowN30zcOeNsD2HPVPqp4n3yjz8FJoLusKgrF9yd2WSTVS2V6Q7tDMmx4PPvZKPORRcwkoDV0AY6pgFvBHkGbxvG0mQuC8l97QuocsPspw76girUjPpqbqbW2thUdvrkrw3I%2BFwjySq9suD7%2BJ4TnLUDtUF2fGEVxDz8gnBi%2FWNQstKGkDbxyNhljpw%2BAKJ3VcqQ0CnRwVL5Qwx33i284LcVhVw6ncTP%2BVLBi4X8lnz3jmkIOhyOFRG5SNmfHYmAkdesiAkPraW4miAIHkCRzCs5uoZg1BFFJv4YhRok99Tz&X-Amz-Signature=2a0f3793408ab9fbaae2b1ca0883cf1140832f840196f2dd99dd2bc9597537f4&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 디테일 패널 → `Target Skeletal Mesh`에 `SpiderMesh` 지정(없으면 일단 PASS)
		- Joint Config 배열 24개 추가 및 관절 이름들 Constraint Name에 넣기를 하면 너무나 빡세다(24개를 언제 다넣나…).  C++의 구조가 바뀌거나 블루포인트가 컴파일될 때, 언리얼이 컴포넌트 탬플릿을 재생성하면서 JointConfigs에 직접 넣은 24개 값이 날아갈 수 있는 문제가 있다(실제로 2번 정도 당했다).

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/d65587c3-19ec-495b-b250-51f8b55feaeb/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RWRF2K4V%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071905Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIFeCxePIfTxz%2B9fJ1ZuQ02Y077FzEtqeN2OlYXsBdM%2BGAiEA%2FoH7FnD%2FuLgnLZ2Er7Sks9Sc2%2BF5BVVrN0reLwnt61cq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDChD%2BM1mMHO0TpG6UCrcA6i1thjNDL2XcgVVb2RNlXMuRkiOLZSBjtu0CpDa0VYJIHiacNqPlVasNKa%2FGlMLFkoiHAgMzjnvdfIIz7A77uxaVSrDXU1W5cpqEjSCYAf1iLBVItl5tsXmz%2FfmTZ7F3BgC2SdZ6prCIeznvU8kqHqk%2FN8IZ%2BqDKG1j%2BXSFc0jVcovqxD7Ebn7YrPBjM6tGXuEWEHwJ7fov6c4c1Psc%2B48hmuzGXwyzLG9rrTz0PN2FABc1oks0scwZHrhNSQUOskpd4UlsHaToYGUcbuiYZECv6Xo6zXmB1wHhQQsKQguIjQYkLc8lxdXQeNss8UxPyUPaSn%2Bhub%2BSJ9lUgKsJ1R4wwuHaGwMhu5JZLWeEFMWS2iMwljizgred2CTdJm7IWWPn4HMOxgfuqIr%2BzIXSD1yLlouf%2F6IabteYXRPZHQY3JTmNtgq0sDnL5xZy8jyu1Bbnip2YcuFJ%2Fr456CesUYgmvsPOH0ONjcQtU8Per2mnRY2H9i2kZLa3Da5zzjqZ0CX%2BiH9cm%2FoVc0o%2BaGXdmz8mEmgndiq8GIul0xRf%2FuEqjoHjv1rFH9eZLbbQ%2BTzlfI%2BwbraUy8eVmCHgRkhlkp99OjQPu1dK3jLZjYPoG4%2Bx%2B5zBqoxVjqujbrS%2BMN6A1dAGOqUBHIOx5ZfJWQXMyt6jIZEDTtXR2xPv684vdpYwTrQxTkM51TNOzSTPsCWyet9O3pjW8yd6BUy2zqat7fI1BgkKqKllncXqq6m%2BD%2Fgm6k7ZxuXVwWW%2Bu05qsbv5STCrVYPIpIbdywg0l50BrallDSl0lDCqkbv%2Fm8NeZ%2BpvaIXiQybiXB8yBkGn1Etg5vmfVl%2B%2F8So3x9vctJkOEGxg7zyrZ8H%2BEmMw&X-Amz-Signature=408b6f86534a0a5c66b4c4d19ef8ab17815af5c7bc706a83c3d5818a7cc317f2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)
			
			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/505bfb15-df44-41e5-9f7a-6624a32e4070/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666WLOOQGN%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071904Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIE3AMra1ADGHCiBUKGmVnesNzbpTgkUNQKF9SKNnAg0RAiAjQ0177PL%2BlSrQ%2FyRlsX4fsyGRRL5%2FNMuONxGGhFyXNSr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMPQGC6HsiVWsFCNHKKtwD5ayautl31FnUoQYzztudHk8YcBOKIwIZXB11%2B85XV90XRxI8KwUoI7L3G15IPFa7x9nb%2BhUdHwhabSkGleUmfziYkIIZhDZTAdAFb5%2FLrxeuIpNJsAuuhfp0t6lPZABxEooBt%2B3DQVkvv0qsx0aLrB1jPNMFZZ7k%2FSglpNns5cTTSEVGSLfNk0WK5h8ah2MXbTgwioklGOrJyvT900ZnqaQ%2BTSlsgkk3y34NnUVTSjue2wewatjiQByft%2BsspeNtAsbIP%2B4nNj0CEp412XnkHYSVSro8Rcsfd%2FEY1O3oFMaYJItgzSYPwOfJXmrKaTO7uKRRNzIM4sIDPSbmJNcZg0lTrvPFQFs%2FtqYfO8pKZ6QXeKBoBbqkjtkvOO4L3pF%2BZEluMCwIEalLTyekVSbxIwTgg%2FIsAZY0b4UlMfuNRRkIBfhd4ELt3A32AdlxphXCIQDlvuQA9EasHkwuCdgYsyT0c1FYR%2BClmYAVECFGWGh1sqlweo73zHfz00cDRj1RwRVYEjbI%2BB%2BgZD8IJwyGhCV1zwAPkEPVGjwB9yu6836%2Baj4pdrGfhgNHDSOijZgMfNYmnUgQW%2FlqmracDikuwCci%2B20zOdygrYT2Syuo%2Bs2K8LOVx%2FTgMEsqD0UwqoDV0AY6pgF1Ntnk5aPxTUD350fdxqEhF7KoOAYAA73ZL%2Frh5thCreemh2tFoYaiorjPAIQnvfVeq2%2FZYAq0GUfGVLlvoAHVsgvNwZ9oAZxsYryUPYjEiM5I93wHWsJJ0PZA%2B26T36%2Fnk3Mm6%2F9gAXAP%2FaWWAtKNZbMEYaPqmB1YcSupddAsAn%2FzQ%2FoX7rS4bEltkexkvAVdYmD4O5sxtPw9WpQ5uqOYkqhomSLP&X-Amz-Signature=29cbf6ce7c7d18784ea1e60798f14fc36fe7575197ad4a0ffc42bbf99c2dd183&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 따라서 블루포인트 안에 24개의 값을 직접 넣지 말고, 설정 에셋 하나만 참조하게 만들어서, 다시 컴파일되어도 24개의 관절 목록은 따로 분리되어 저장할 수 있어서 훨씬 안전하다.

		<details>
		  <summary>FSpiderJointMotorConfig</summary>
		
		
		```c++
		#include "SpiderJointControllerComponent.h"
		
		#include "Components/SkeletalMeshComponent.h"
		#include "PhysicsEngine/ConstraintInstance.h"
		
		USpiderJointControllerComponent::USpiderJointControllerComponent()
		{
			// Learning Agents의 Perform Agent Action 단계에서 ApplyJointActions를 호출할 예정이므로,
			// 이 컴포넌트가 자체 Tick으로 목표값을 계속 바꿀 필요는 없다.
			PrimaryComponentTick.bCanEverTick = false;
		}
		
		void USpiderJointControllerComponent::BeginPlay()
		{
			Super::BeginPlay();
		
			InitializeControlledConstraints();
		}
		
		void USpiderJointControllerComponent::TickComponent(
			float DeltaTime,
			ELevelTick TickType,
			FActorComponentTickFunction* ThisTickFunction
		)
		{
			Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
		
			// 현재 구조에서는 Tick에서 자동 진동을 만들지 않는다.
			// 관절 제어는 Learning Agents Action 또는 외부 디버그 함수가 ApplyJointActions를 호출할 때 수행한다.
		}
		
		const TArray<FSpiderJointMotorConfig>* USpiderJointControllerComponent::GetActiveJointConfigs() const
		{
			if (JointConfigData != nullptr)
			{
				return &JointConfigData->JointConfigs;
			}
		
			return &JointConfigs;
		}
		
		void USpiderJointControllerComponent::InitializeControlledConstraints()
		{
			ResolvedConstraints.Reset();
			bLoggedActionCountMismatch = false;
		
			// 1. 제어할 SkeletalMeshComponent 결정
			//
			// TargetSkeletalMesh를 BP에서 직접 지정했다면 그걸 우선 사용한다.
			// 비워두었다면 Owner Actor 안에서 첫 번째 SkeletalMeshComponent를 자동으로 찾는다.
			if (TargetSkeletalMesh != nullptr)
			{
				ResolvedSkeletalMesh = TargetSkeletalMesh;
			}
			else if (GetOwner() != nullptr)
			{
				ResolvedSkeletalMesh = GetOwner()->FindComponentByClass<USkeletalMeshComponent>();
			}
		
			if (ResolvedSkeletalMesh == nullptr)
			{
				UE_LOG(
					LogTemp,
					Warning,
					TEXT("[SpiderJointController] SkeletalMeshComponent를 찾지 못했습니다.")
				);
				return;
			}
		
			const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
		
			if (ActiveJointConfigs == nullptr || ActiveJointConfigs->Num() == 0)
			{
				UE_LOG(
					LogTemp,
					Warning,
					TEXT("[SpiderJointController] 관절 설정이 비어 있습니다. JointConfigData 또는 JointConfigs를 설정해야 합니다.")
				);
				return;
			}
		
			ResolvedConstraints.Reserve(ActiveJointConfigs->Num());
		
			// 2. ActiveJointConfigs에 등록된 Constraint들을 실제 Physics Asset에서 찾는다.
			//
			// 중요한 점:
			// ResolvedConstraints 배열은 ActiveJointConfigs와 같은 순서를 유지한다.
			// 따라서 Action[i]는 ActiveJointConfigs[i] / ResolvedConstraints[i]에 대응한다.
			for (int32 Index = 0; Index < ActiveJointConfigs->Num(); ++Index)
			{
				const FSpiderJointMotorConfig& Config = (*ActiveJointConfigs)[Index];
		
				if (Config.ConstraintName.IsNone())
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] JointConfig[%d]의 ConstraintName이 비어 있습니다."),
						Index
					);
		
					ResolvedConstraints.Add(nullptr);
					continue;
				}
		
				FConstraintInstance* Constraint = ResolvedSkeletalMesh->FindConstraintInstance(Config.ConstraintName);
		
				if (Constraint == nullptr)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] Constraint '%s'를 찾지 못했습니다. Index=%d"),
						*Config.ConstraintName.ToString(),
						Index
					);
		
					ResolvedConstraints.Add(nullptr);
					continue;
				}
		
				// 3. 각 Constraint의 Angular Motor 설정
				//
				// SLERP 모드는 목표 회전 Quaternion을 향해 관절을 움직이게 하는 방식이다.
				// 현재는 학습기가 직접 토크를 내는 구조가 아니라,
				// 목표 자세를 출력하고 Physics Constraint Motor가 그 자세를 추종하는 구조다.
				Constraint->SetAngularDriveMode(EAngularDriveMode::SLERP);
				Constraint->SetOrientationDriveSLERP(true);
		
				// PositionStrength:
				//   목표 회전에 얼마나 강하게 따라갈지 결정한다.
				//
				// VelocityStrength:
				//   움직임의 감쇠 성격이다.
				//   너무 낮으면 떨림이 커질 수 있고, 너무 높으면 반응이 둔해질 수 있다.
				//
				// ForceLimit:
				//   모터가 낼 수 있는 최대 힘이다.
				//   너무 크면 학습 초기 랜덤 Action에서 로봇이 과하게 튈 수 있고,
				//   너무 작으면 관절이 목표값을 따라가지 못한다.
				Constraint->SetAngularDriveParams(
					Config.PositionStrength,
					Config.VelocityStrength,
					Config.ForceLimit
				);
		
				// Action 값이 0일 때의 기준 자세를 먼저 적용한다.
				Constraint->SetAngularOrientationTarget(
					Config.BaseTargetOrientation.Quaternion()
				);
		
				ResolvedConstraints.Add(Constraint);
		
				UE_LOG(
					LogTemp,
					Log,
					TEXT("[SpiderJointController] Joint[%d] Constraint '%s' 초기화 완료."),
					Index,
					*Config.ConstraintName.ToString()
				);
			}
		
			UE_LOG(
				LogTemp,
				Log,
				TEXT("[SpiderJointController] 제어 관절 초기화 완료. Configs=%d, ResolvedConstraints=%d, Source=%s"),
				ActiveJointConfigs->Num(),
				ResolvedConstraints.Num(),
				JointConfigData != nullptr ? TEXT("DataAsset") : TEXT("Component")
			);
		}
		
		void USpiderJointControllerComponent::ApplyJointActions(const TArray<float>& JointActions)
		{
			// 아직 Constraint 초기화가 안 된 상태라면 한 번 시도한다.
			// BeginPlay 순서나 BP 호출 순서 문제로 ResolvedConstraints가 비어 있을 수 있기 때문이다.
			if (ResolvedConstraints.Num() == 0)
			{
				InitializeControlledConstraints();
			}
		
			const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
		
			if (ActiveJointConfigs == nullptr || ActiveJointConfigs->Num() == 0 || ResolvedConstraints.Num() == 0)
			{
				return;
			}
		
			if (JointActions.Num() != ActiveJointConfigs->Num() && !bLoggedActionCountMismatch)
			{
				UE_LOG(
					LogTemp,
					Warning,
					TEXT("[SpiderJointController] Action 개수와 관절 설정 개수가 다릅니다. Actions=%d, Configs=%d"),
					JointActions.Num(),
					ActiveJointConfigs->Num()
				);
		
				bLoggedActionCountMismatch = true;
			}
		
			// Action 개수가 다르더라도 가능한 범위까지만 적용한다.
			// 이렇게 하면 테스트 중 일부 Action만 들어와도 에디터가 멈추지 않고 동작을 확인할 수 있다.
			const int32 ApplyCount = FMath::Min3(
				JointActions.Num(),
				ActiveJointConfigs->Num(),
				ResolvedConstraints.Num()
			);
		
			for (int32 Index = 0; Index < ApplyCount; ++Index)
			{
				FConstraintInstance* Constraint = ResolvedConstraints[Index];
		
				if (Constraint == nullptr)
				{
					continue;
				}
		
				const FSpiderJointMotorConfig& Config = (*ActiveJointConfigs)[Index];
		
				// Learning Agents의 Continuous Action은 정규화된 제어값으로 사용할 것이다.
				// 따라서 여기서는 안전하게 -1.0 ~ +1.0 범위로 제한한다.
				//
				// Clamp를 하는 이유:
				// 학습 초기에는 랜덤 정책이 예상보다 큰 값을 만들 수 있다.
				// 이 값을 그대로 각도에 곱하면 관절이 과도하게 꺾이거나 물리 폭주가 날 수 있다.
				const float ActionValue = FMath::Clamp(JointActions[Index], -1.0f, 1.0f);
		
				// ActionValue 하나를 관절 하나의 목표 회전 변화량으로 변환한다.
				//
				// BaseTargetOrientation:
				//   Action이 0일 때의 기준 자세
				//
				// ActionScale:
				//   Action -1~+1을 Pitch/Yaw/Roll 각도 변화로 바꾸는 스케일
				//
				// 예:
				//   BaseTargetOrientation = (0, 0, 0)
				//   ActionScale.Pitch = 30
				//   ActionValue = 1
				//   → Pitch +30도 목표
				FRotator TargetOrientation = Config.BaseTargetOrientation;
				TargetOrientation.Pitch += Config.ActionScale.Pitch * ActionValue;
				TargetOrientation.Yaw += Config.ActionScale.Yaw * ActionValue;
				TargetOrientation.Roll += Config.ActionScale.Roll * ActionValue;
		
				Constraint->SetAngularOrientationTarget(
					TargetOrientation.Quaternion()
				);
			}
		}
		
		int32 USpiderJointControllerComponent::GetControlledJointCount() const
		{
			const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
		
			if (ActiveJointConfigs == nullptr)
			{
				return 0;
			}
		
			return ActiveJointConfigs->Num();
		}
		```
		
		
		
		  </details>

		- 따라서 UDataAsset 클래스를 하나 추가해서 관절 설정만 저장해서 사용하도록 하자

			<details>
			  <summary>USpiderJointControllerComponent.h</summary>
			
			
			```c++
			#pragma once
			
			#include "CoreMinimal.h"
			#include "Components/ActorComponent.h"
			#include "Engine/DataAsset.h"
			#include "SpiderJointControllerComponent.generated.h"
			
			class USkeletalMeshComponent;
			struct FConstraintInstance;
			
			USTRUCT(BlueprintType)
			struct FSpiderJointMotorConfig
			{
				GENERATED_BODY()
			
				// Physics Asset 안에서 제어할 Constraint 이름이다.
				// 코드에 관절 이름을 하드코딩하지 않고 Data Asset에서 설정하기 위해 사용한다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FName ConstraintName = NAME_None;
			
				// Action 값이 0일 때의 기준 목표 회전이다.
				// 학습기가 아무 조작을 하지 않았을 때 관절이 유지할 기본 자세라고 보면 된다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FRotator BaseTargetOrientation = FRotator::ZeroRotator;
			
				// Action 값을 실제 회전 각도 변화로 바꾸는 스케일이다.
				// 예: ActionScale.Pitch = 30이면 Action +1.0이 Pitch +30도 의미가 된다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				FRotator ActionScale = FRotator(30.0f, 0.0f, 0.0f);
			
				// 목표 자세를 따라가려는 위치 제어 강도다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float PositionStrength = 5000.0f;
			
				// 관절 속도 감쇠 강도다.
				// 너무 낮으면 떨림이 커질 수 있고, 너무 높으면 반응이 둔해질 수 있다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float VelocityStrength = 500.0f;
			
				// 관절 모터가 낼 수 있는 최대 힘이다.
				// 너무 크면 물리 폭주 가능성이 있고, 너무 작으면 관절이 목표값을 따라가지 못할 수 있다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				float ForceLimit = 100000.0f;
			};
			
			UCLASS(BlueprintType)
			class SPIDERRL_API USpiderJointConfigData : public UDataAsset
			{
				GENERATED_BODY()
			
			public:
				// 6족 거미 로봇의 관절 설정 목록이다.
				// 현재 목표는 6개 다리 × 다리당 4개 Constraint = 24개 항목이다.
				//
				// 이 값을 BP 컴포넌트 안에 직접 저장하지 않고 Data Asset으로 분리하는 이유:
				// - BP 컴파일/컴포넌트 재생성 때 설정이 날아가는 위험을 줄이기 위해
				// - 6족/8족/테스트용 설정을 에셋 단위로 교체하기 위해
				// - C++ 코드에 관절 이름을 하드코딩하지 않기 위해
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TArray<FSpiderJointMotorConfig> JointConfigs;
			};
			
			UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
			class SPIDERRL_API USpiderJointControllerComponent : public UActorComponent
			{
				GENERATED_BODY()
			
			public:
				USpiderJointControllerComponent();
			
			protected:
				virtual void BeginPlay() override;
			
			public:
				virtual void TickComponent(
					float DeltaTime,
					ELevelTick TickType,
					FActorComponentTickFunction* ThisTickFunction
				) override;
			
				// Learning Agents가 출력한 Action 배열을 실제 관절 목표 회전으로 적용한다.
				//
				// JointActions[i]는 ActiveJointConfigs[i]에 대응한다.
				// 현재 설계에서는 24개 Action이 24개 Constraint에 대응한다.
				UFUNCTION(BlueprintCallable, Category = "Spider Joint")
				void ApplyJointActions(const TArray<float>& JointActions);
			
				// 현재 등록된 제어 관절 수를 반환한다.
				// Learning Agents의 Action Size와 비교하거나 디버그 출력에 사용한다.
				UFUNCTION(BlueprintPure, Category = "Spider Joint")
				int32 GetControlledJointCount() const;
			
			private:
				void InitializeControlledConstraints();
			
				// 실제로 사용할 관절 설정 배열을 반환한다.
				// JointConfigData가 있으면 Data Asset 설정을 우선 사용하고,
				// 없으면 컴포넌트 내부 JointConfigs를 fallback으로 사용한다.
				const TArray<FSpiderJointMotorConfig>* GetActiveJointConfigs() const;
			
			protected:
				// 제어할 SkeletalMeshComponent를 직접 지정할 수 있다.
				// 비워두면 Owner에서 첫 번째 SkeletalMeshComponent를 자동으로 찾는다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TObjectPtr<USkeletalMeshComponent> TargetSkeletalMesh = nullptr;
			
				// 관절 설정 Data Asset이다.
				// 실제 프로젝트에서는 여기에 DA_SpiderJointConfig 같은 에셋을 넣는 것을 권장한다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TObjectPtr<USpiderJointConfigData> JointConfigData = nullptr;
			
				// fallback용 내부 관절 설정 배열이다.
				// JointConfigData가 없을 때만 사용한다.
				// 실제 운영에서는 Data Asset 사용을 우선한다.
				UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Joint")
				TArray<FSpiderJointMotorConfig> JointConfigs;
			
			private:
				UPROPERTY()
				TObjectPtr<USkeletalMeshComponent> ResolvedSkeletalMesh = nullptr;
			
				// ActiveJointConfigs와 같은 순서로 매칭되는 실제 Constraint 포인터 배열이다.
				// Action[i]는 ResolvedConstraints[i]에 적용된다.
				TArray<FConstraintInstance*> ResolvedConstraints;
			
				// Action 개수 불일치 경고를 매 프레임 반복 출력하지 않기 위한 플래그다.
				bool bLoggedActionCountMismatch = false;
			};
			```
			
			- 
			
			
			  </details>


			<details>
			  <summary>SpiderJointControllerComponent.cpp</summary>
			
			
			```c++
			#include "SpiderJointControllerComponent.h"
			
			#include "Components/SkeletalMeshComponent.h"
			#include "PhysicsEngine/ConstraintInstance.h"
			
			USpiderJointControllerComponent::USpiderJointControllerComponent()
			{
				// Learning Agents의 Perform Agent Action 단계에서 ApplyJointActions를 호출할 예정이므로,
				// 이 컴포넌트가 자체 Tick으로 목표값을 계속 바꿀 필요는 없다.
				PrimaryComponentTick.bCanEverTick = false;
			}
			
			void USpiderJointControllerComponent::BeginPlay()
			{
				Super::BeginPlay();
			
				InitializeControlledConstraints();
			}
			
			void USpiderJointControllerComponent::TickComponent(
				float DeltaTime,
				ELevelTick TickType,
				FActorComponentTickFunction* ThisTickFunction
			)
			{
				Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
			
				// 현재 구조에서는 Tick에서 자동 진동을 만들지 않는다.
				// 관절 제어는 Learning Agents Action 또는 외부 디버그 함수가 ApplyJointActions를 호출할 때 수행한다.
			}
			
			const TArray<FSpiderJointMotorConfig>* USpiderJointControllerComponent::GetActiveJointConfigs() const
			{
				if (JointConfigData != nullptr)
				{
					return &JointConfigData->JointConfigs;
				}
			
				return &JointConfigs;
			}
			
			void USpiderJointControllerComponent::InitializeControlledConstraints()
			{
				ResolvedConstraints.Reset();
				bLoggedActionCountMismatch = false;
			
				// 1. 제어할 SkeletalMeshComponent 결정
				//
				// TargetSkeletalMesh를 BP에서 직접 지정했다면 그걸 우선 사용한다.
				// 비워두었다면 Owner Actor 안에서 첫 번째 SkeletalMeshComponent를 자동으로 찾는다.
				if (TargetSkeletalMesh != nullptr)
				{
					ResolvedSkeletalMesh = TargetSkeletalMesh;
				}
				else if (GetOwner() != nullptr)
				{
					ResolvedSkeletalMesh = GetOwner()->FindComponentByClass<USkeletalMeshComponent>();
				}
			
				if (ResolvedSkeletalMesh == nullptr)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] SkeletalMeshComponent를 찾지 못했습니다.")
					);
					return;
				}
			
				const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
			
				if (ActiveJointConfigs == nullptr || ActiveJointConfigs->Num() == 0)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] 관절 설정이 비어 있습니다. JointConfigData 또는 JointConfigs를 설정해야 합니다.")
					);
					return;
				}
			
				ResolvedConstraints.Reserve(ActiveJointConfigs->Num());
			
				// 2. ActiveJointConfigs에 등록된 Constraint들을 실제 Physics Asset에서 찾는다.
				//
				// 중요한 점:
				// ResolvedConstraints 배열은 ActiveJointConfigs와 같은 순서를 유지한다.
				// 따라서 Action[i]는 ActiveJointConfigs[i] / ResolvedConstraints[i]에 대응한다.
				for (int32 Index = 0; Index < ActiveJointConfigs->Num(); ++Index)
				{
					const FSpiderJointMotorConfig& Config = (*ActiveJointConfigs)[Index];
			
					if (Config.ConstraintName.IsNone())
					{
						UE_LOG(
							LogTemp,
							Warning,
							TEXT("[SpiderJointController] JointConfig[%d]의 ConstraintName이 비어 있습니다."),
							Index
						);
			
						ResolvedConstraints.Add(nullptr);
						continue;
					}
			
					FConstraintInstance* Constraint = ResolvedSkeletalMesh->FindConstraintInstance(Config.ConstraintName);
			
					if (Constraint == nullptr)
					{
						UE_LOG(
							LogTemp,
							Warning,
							TEXT("[SpiderJointController] Constraint '%s'를 찾지 못했습니다. Index=%d"),
							*Config.ConstraintName.ToString(),
							Index
						);
			
						ResolvedConstraints.Add(nullptr);
						continue;
					}
			
					// 3. 각 Constraint의 Angular Motor 설정
					//
					// SLERP 모드는 목표 회전 Quaternion을 향해 관절을 움직이게 하는 방식이다.
					// 현재는 학습기가 직접 토크를 내는 구조가 아니라,
					// 목표 자세를 출력하고 Physics Constraint Motor가 그 자세를 추종하는 구조다.
					Constraint->SetAngularDriveMode(EAngularDriveMode::SLERP);
					Constraint->SetOrientationDriveSLERP(true);
			
					// PositionStrength:
					//   목표 회전에 얼마나 강하게 따라갈지 결정한다.
					//
					// VelocityStrength:
					//   움직임의 감쇠 성격이다.
					//   너무 낮으면 떨림이 커질 수 있고, 너무 높으면 반응이 둔해질 수 있다.
					//
					// ForceLimit:
					//   모터가 낼 수 있는 최대 힘이다.
					//   너무 크면 학습 초기 랜덤 Action에서 로봇이 과하게 튈 수 있고,
					//   너무 작으면 관절이 목표값을 따라가지 못한다.
					Constraint->SetAngularDriveParams(
						Config.PositionStrength,
						Config.VelocityStrength,
						Config.ForceLimit
					);
			
					// Action 값이 0일 때의 기준 자세를 먼저 적용한다.
					Constraint->SetAngularOrientationTarget(
						Config.BaseTargetOrientation.Quaternion()
					);
			
					ResolvedConstraints.Add(Constraint);
			
					UE_LOG(
						LogTemp,
						Log,
						TEXT("[SpiderJointController] Joint[%d] Constraint '%s' 초기화 완료."),
						Index,
						*Config.ConstraintName.ToString()
					);
				}
			
				UE_LOG(
					LogTemp,
					Log,
					TEXT("[SpiderJointController] 제어 관절 초기화 완료. Configs=%d, ResolvedConstraints=%d, Source=%s"),
					ActiveJointConfigs->Num(),
					ResolvedConstraints.Num(),
					JointConfigData != nullptr ? TEXT("DataAsset") : TEXT("Component")
				);
			}
			
			void USpiderJointControllerComponent::ApplyJointActions(const TArray<float>& JointActions)
			{
				// 아직 Constraint 초기화가 안 된 상태라면 한 번 시도한다.
				// BeginPlay 순서나 BP 호출 순서 문제로 ResolvedConstraints가 비어 있을 수 있기 때문이다.
				if (ResolvedConstraints.Num() == 0)
				{
					InitializeControlledConstraints();
				}
			
				const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
			
				if (ActiveJointConfigs == nullptr || ActiveJointConfigs->Num() == 0 || ResolvedConstraints.Num() == 0)
				{
					return;
				}
			
				if (JointActions.Num() != ActiveJointConfigs->Num() && !bLoggedActionCountMismatch)
				{
					UE_LOG(
						LogTemp,
						Warning,
						TEXT("[SpiderJointController] Action 개수와 관절 설정 개수가 다릅니다. Actions=%d, Configs=%d"),
						JointActions.Num(),
						ActiveJointConfigs->Num()
					);
			
					bLoggedActionCountMismatch = true;
				}
			
				// Action 개수가 다르더라도 가능한 범위까지만 적용한다.
				// 이렇게 하면 테스트 중 일부 Action만 들어와도 에디터가 멈추지 않고 동작을 확인할 수 있다.
				const int32 ApplyCount = FMath::Min3(
					JointActions.Num(),
					ActiveJointConfigs->Num(),
					ResolvedConstraints.Num()
				);
			
				for (int32 Index = 0; Index < ApplyCount; ++Index)
				{
					FConstraintInstance* Constraint = ResolvedConstraints[Index];
			
					if (Constraint == nullptr)
					{
						continue;
					}
			
					const FSpiderJointMotorConfig& Config = (*ActiveJointConfigs)[Index];
			
					// Learning Agents의 Continuous Action은 정규화된 제어값으로 사용할 것이다.
					// 따라서 여기서는 안전하게 -1.0 ~ +1.0 범위로 제한한다.
					//
					// Clamp를 하는 이유:
					// 학습 초기에는 랜덤 정책이 예상보다 큰 값을 만들 수 있다.
					// 이 값을 그대로 각도에 곱하면 관절이 과도하게 꺾이거나 물리 폭주가 날 수 있다.
					const float ActionValue = FMath::Clamp(JointActions[Index], -1.0f, 1.0f);
			
					// ActionValue 하나를 관절 하나의 목표 회전 변화량으로 변환한다.
					//
					// BaseTargetOrientation:
					//   Action이 0일 때의 기준 자세
					//
					// ActionScale:
					//   Action -1~+1을 Pitch/Yaw/Roll 각도 변화로 바꾸는 스케일
					//
					// 예:
					//   BaseTargetOrientation = (0, 0, 0)
					//   ActionScale.Pitch = 30
					//   ActionValue = 1
					//   → Pitch +30도 목표
					FRotator TargetOrientation = Config.BaseTargetOrientation;
					TargetOrientation.Pitch += Config.ActionScale.Pitch * ActionValue;
					TargetOrientation.Yaw += Config.ActionScale.Yaw * ActionValue;
					TargetOrientation.Roll += Config.ActionScale.Roll * ActionValue;
			
					Constraint->SetAngularOrientationTarget(
						TargetOrientation.Quaternion()
					);
				}
			}
			
			int32 USpiderJointControllerComponent::GetControlledJointCount() const
			{
				const TArray<FSpiderJointMotorConfig>* ActiveJointConfigs = GetActiveJointConfigs();
			
				if (ActiveJointConfigs == nullptr)
				{
					return 0;
				}
			
				return ActiveJointConfigs->Num();
			}
			```
			
			- 
			
			
			  </details>


		```c++
		DA_SpiderJointConfig
		└─ JointConfigs[24]
		   ├─ BackLeg1_L
		   ├─ BackLeg2_L
		   ├─ ...
		   └─ MiddleLeg4_R
		
		BP_SpiderRobot
		└─ SpiderJointController
		   └─ JointConfigData = DA_SpiderJointConfig
		
		BeginPlay
		→ SpiderJointController.InitializeControlledConstraints()
		→ DA_SpiderJointConfig에서 24개 이름 읽기
		→ SpiderMesh Physics Asset에서 24개 Constraint 찾기
		→ ResolvedConstraints에 저장
		
		학습 중
		→ BP_SpiderInteractor.Perform Agent Action
		→ 24개 Action 추출
		→ SpiderJointController.ApplyJointActions(Action[24])
		→ 각 Constraint 목표 회전 변경
		```


	### 2.2.10. DA_SpiderJointConfig 생성 및 BP_SpiderRobot 연결


		> Data Asset이란? → 코드 로직은 없고, 설정 데이터만 저장하는 에셋파일

		- 컨텐츠 브라우저에 폴더 생성

			```c++
			Content/Robots/Config
			```

		- 우클릭 → Miscellaneous → Data Asset(기타→데이터 에셋)
		- 데이터 에셋 종류 선택(우리가 이미 만들어둔 데이터) 및 이름 설정(DA_SpiderJointConfig)

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/48555f2a-830e-4056-9c18-a6adb7720c11/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663C7OZVG3%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071908Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIH03yC4fKfyhQjt1hAW9UL5Nkr2cnwF41qWb0IE8BBqAAiEAmDE0VhBCfHynr4XghOzj%2BgZL7SazYy7%2F9oVqAKCKeFAq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDL1DdYy1Cw42BxlvsircA98zfpJX43lPEqFVslb82MfVHAdR5hKJEFI3y4boc%2BmdNkRaprU8wCcQhpxkWqnSXWyH3AUSLnjW9u1tA%2FXhTlqu91IIFpT9I91tY5MeThtCN%2Fh48%2FNRsAvzohxnc7AtY2LQM25hjJp%2FLKDWSygvnIHXMN6dAXwCExyLRQUqUP8YTRHzT8BFRsC7nBTONHmWDPBaEBWoUgocA3lPUBbFL%2FIY3Q2X%2BVCWYksaYgR61Y22qYcZetjECGIX6YnjyxNiQOk5HVmzGHHZABjVXo%2Fg%2Be9X9uEW4tv%2BsuRuqtmXcsgT2L15YsMFaq1h6Ffs%2BEeIr3U6vOQYJeeFXj%2BONaekbLOVSb4xnHUlRqkSCtgeQ404pJq7OWE%2BhZjgAsPKDaXxPFvn9fvJ7RDj6mG75SWjjDWUHaddgx%2BCzCzXFmhMm26j7roeFM6VxsBROjOZswmmEI3k%2F48YgLVGvlJ7crD8cunOdgeAV8Sq1tdq7yQxcyuTxvduy3MYVM3hWQaRPoC4GuZyvW7a9iwpm72FayAVxCeWG0b7QGqupeWCLmSnae5NC3GMAenyS0t9SaccDJU1cVzBxFEU0QJ9Ub5VwM8uBWo0T%2FrP9jrpb9wwLcMwkf6IOxyOSZtztaPNs8jDMLmA1dAGOqUBZM29fq4Z5oS2TzIX2l8QezOTX4PQyp9%2FmplsCmLt%2BYG3DAfb0dSh97UNU9vrvXLzjOOiy%2BGtOvsUTLYqds6BYBdunCqujNGfE14Rj61lnQMDV09cSr4wcpNuU%2Ba9WINcUjtWCay9cFCFFSvVvOv%2BASuAODZcj9mPBzr6kx9e1E6TYKSFjEy4kqKOA3uMTCajvZXrMWK6nER%2BzO8CjbgyqfX9COAg&X-Amz-Signature=02635417f741f565a679cc5373364d6f1a22dcc9b46670d06fcbd250fbf3113b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 이 세셋이 앞으로 24개의 관절 이름과 관절별 제어 설정을 보관하는 설정 파일 역할을 하게 된다
		- 생성한 데이터 에셋(DA_SpiderJointConfig) 더블 클릭을 하면 안에 이미 생성해둔 Joint Config 배열이 보인다. 여기서 배열 크기를 관절의 개수와 같은 24개로 설정하고 관절의 순서대로 배열에 관절이름을 채워넣고 저장

			<details>
			  <summary>참고</summary>
			
			
			```c++
			0  BackLeg1_L
			1  BackLeg2_L
			2  BackLeg3_L
			3  BackLeg4_L
			
			4  BackLeg1_R
			5  BackLeg2_R
			6  BackLeg3_R
			7  BackLeg4_R
			
			8  FrontLeg1_L
			9  FrontLeg2_L
			10 FrontLeg3_L
			11 FrontLeg4_L
			
			12 FrontLeg1_R
			13 FrontLeg2_R
			14 FrontLeg3_R
			15 FrontLeg4_R
			
			16 MiddleLeg1_L
			17 MiddleLeg2_L
			18 MiddleLeg3_L
			19 MiddleLeg4_L
			
			20 MiddleLeg1_R
			21 MiddleLeg2_R
			22 MiddleLeg3_R
			23 MiddleLeg4_R
			```
			
			
			
			  </details>

		- 이제 `BP_SpiderRobot`을 열어서 왼쪽 컴포넌트에서 SpiderJointController 선택
		- 오른쪽 Details 패널에서 새로 생긴 항목 Joint Config Data 를 찾아서, 거기에 방금 만든 데이터 에셋(DA_SpiderJointConfig)을 지정

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/26c728a1-8f49-43bb-86e2-66452d70f818/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466ZMTU4NOA%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071909Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCkOxSvzHM1OYFdbyQ6t1DVM%2FH3X5ycvfmWUXQeTMA4uwIhAKDng20ttCqVWAqXJ78yWZ17LvbOeeWGaPIKweSoF83xKv8DCHgQABoMNjM3NDIzMTgzODA1IgxnG4Uiz3lXaDhpy8Uq3AP%2BLy9Yd%2BV%2FF63dWDY7sRmZ1BZK4bPueAUQiDwSQwuIMy7%2BFIV7a%2B0wj%2BDqOF00BLc%2BzsAQSnkN%2FUhsIvHsGOW6QO6nuQw%2FswFC7dS0M%2BXj6YeScNEJLqcnJQOnveVA1xZleatXVh3PEFgZOiYyjeOSb9E5vCBiOMiyq7Mod0HrQHzzh9UdOtEKsmJkfr%2FD14gq%2FhSHJBN%2FLAAvjuxSXvFiBWjjI7RiUqV5YKb%2BQ%2FZb8pDATOfKiU10yh%2FHQj7ZNQFQ5%2Br38OqVlebPjxVO9J4qHRwAniU23giouAcYVyTdJX%2F%2B%2FDZonH8JrXBTdNCy1AtgTBRovCDONq02UUDlZZOObOF%2BZXWl2esrUl9FDUzkTIu%2BRBrcHptJLxNiH7Rf26%2BXDaT2idVz7NFy586OYRL4esu6iE9mzKSHFJ8gesGF9p7Zna5o4VysNveYp8RiDXehgrQLjw354GY4FXy2KCo2rKI6EvN2Nt4ikMvH%2F715kSoavwknyPYLI9bqG7M9Bg%2BnqjeaUVmwtMXUPOXcMgftG4K%2F8eaglpWqgDQGFFth2J86rVh6B%2BnG1MlWTs0tUzCWQbUfp2Zs86J8QtftxK2aghq7dj5k7cI5Sn1NevKA1U%2BT9Yc%2BdcSDza%2B2nzCVg9XQBjqkATqgT7yj%2BlPfa8p0kHMbbVEj1OlZTwSGPfnSLIF0G0okPCDljn7ScB7Mysgyrc8NBkPYXNcAVooKMgjIgnUnde3JK6k6B7%2F%2FOszKLzZZIwy7nW9hepiMHVpBwjKctRNnVPhfGk3J1rmuc%2FqXPnytjHYHfB8S22mIHStQApESpJnQGY4rKq5dAsuAChcd%2FzPult5hOyp%2Fnavy5q8OvYHdFn9pNcUz&X-Amz-Signature=456221ef4da47c9d2a66946cebf8df4f0156635fe79faf64130a6a00346d296b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 컴파일 → 저장 후 맵 화면에서 플레이 누른 후 로그를 확인해보자

		<details>
		  <summary>출력 로그</summary>
		
		
		```c++
		LogSlate: Updating window title bar state: overlay mode, drag disabled, window buttons hidden, title bar hidden
		LogWorld: BeginTearingDown for /Game/Maps/UEDPIE_0_TestArena
		LogWorld: UWorld::CleanupWorld for TestArena, bSessionEnded=true, bCleanupResources=true
		LogSlate: InvalidateAllWidgets triggered.  All widgets were invalidated
		LogWorldPartition: UWorldPartition::Uninitialize : World = /Game/Maps/UEDPIE_0_TestArena.TestArena
		LogPlayLevel: Display: Shutting down PIE online subsystems
		LogSlate: InvalidateAllWidgets triggered.  All widgets were invalidated
		LogSlate: Updating window title bar state: overlay mode, drag disabled, window buttons hidden, title bar hidden
		LogAudioMixer: Deinitializing Audio Bus Subsystem for audio device with ID 5
		LogAudioMixer: Display: FMixerPlatformXAudio2::StopAudioStream() called. InstanceID=5, StreamState=4
		LogAudioMixer: Display: FMixerPlatformXAudio2::StopAudioStream() called. InstanceID=5, StreamState=2
		LogUObjectHash: Compacting FUObjectHashTables data took   0.69ms
		LogPlayLevel: Display: Destroying online subsystem :Context_9
		LogDebuggerCommands: Repeating last play command: 선택된 뷰포트
		LogContentBundle: [TestArena(에디터)] Generating Streaming for 0 Content Bundles.
		LogWorldPartition: Display: GenerateStreaming for 'TestArena' started...
		LogWorldPartition: Display: GenerateStreaming for 'TestArena' took 1.358 ms (total: 8.676 ms)
		LogCameraSystemEditor: No camera objects needed building (inspected 0 objects)
		LogPlayLevel: PlayLevel: No blueprints needed recompiling
		LogPlayLevel: Creating play world package: /Game/Maps/UEDPIE_0_TestArena
		LogWorldPartition: Display: UWorldPartition::PostDuplicatePIE started...
		LogWorldPartition: Display: UWorldPartition::PostDuplicatePIE took 179 us (total: 900 us)
		LogPlayLevel: PIE: StaticDuplicateObject took: (0.004253s)
		LogPlayLevel: PIE: Created PIE world by copying editor world from /Game/Maps/TestArena.TestArena to /Game/Maps/UEDPIE_0_TestArena.TestArena (0.004281s)
		LogUObjectHash: Compacting FUObjectHashTables data took   0.66ms
		LogChaosDD: Creating Chaos Debug Draw Scene for world TestArena
		LogWorldPartition: ULevel::OnLevelLoaded(TestArena)(bIsOwningWorldGameWorld=1, bIsOwningWorldPartitioned=1, InitializeForMainWorld=1, InitializeForEditor=0, InitializeForGame=1)
		LogWorldPartition: Display: WorldPartition initialize started...
		LogWorldPartition: UWorldPartition::Initialize : World = /Game/Maps/UEDPIE_0_TestArena.TestArena, World Type = PIE, IsMainWorldPartition = 1, Location = V(0), Rotation = R(0), IsEditor = 0, IsGame = 0, IsPIEWorldTravel = 0, IsCooking = 0
		LogWorldPartition: UWorldPartition::Initialize Context : World NetMode = Standalone, IsServer = 0, IsDedicatedServer = 0, IsServerStreamingEnabled = 0, IsServerStreamingOutEnabled = 0, IsUsingMakingVisibleTransaction = 0, IsUsingMakingInvisibleTransaction = 0
		LogWorldPartition: Display: WorldPartition initialize took 1.430 ms (total: 271.789 ms)
		LogPlayLevel: PIE: World Init took: (0.002864s)
		LogAudio: Display: Creating Audio Device:                 Id: 6, Scope: Unique, Realtime: True
		LogAudioMixer: Display: Audio Mixer Platform Settings:
		LogAudioMixer: Display:     Sample Rate:                          48000
		LogAudioMixer: Display:     Callback Buffer Frame Size Requested: 1024
		LogAudioMixer: Display:     Callback Buffer Frame Size To Use:    1024
		LogAudioMixer: Display:     Number of buffers to queue:           1
		LogAudioMixer: Display:     Max Channels (voices):                32
		LogAudioMixer: Display:     Number of Async Source Workers:       4
		LogAudio: Display: AudioDevice MaxSources: 32
		LogAudio: Display: Audio Spatialization Plugin: None (built-in).
		LogAudio: Display: Audio Reverb Plugin: None (built-in).
		LogAudio: Display: Audio Occlusion Plugin: None (built-in).
		LogAudioMixer: Display: Initializing audio mixer using platform API: 'XAudio2'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Console', Device='스피커(High Definition Audio Device)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Console', Device='마이크(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Multimedia', Device='스피커(High Definition Audio Device)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Multimedia', Device='마이크(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Communications', Device='스피커(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Communications', Device='마이크(2- ABKO EH550)'
		LogAudioMixer: Display: Using Audio Hardware Device 스피커(High Definition Audio Device)
		LogAudioMixer: Display: Initializing Sound Submixes...
		LogAudioMixer: Display: Creating Master Submix 'MasterSubmixDefault'
		LogAudioMixer: Display: Creating Master Submix 'MasterReverbSubmixDefault'
		LogAudioMixer: FMixerPlatformXAudio2::StartAudioStream() called. InstanceID=6
		LogAudioMixer: Display: Output buffers initialized: Frames=1024, Channels=2, Samples=2048, InstanceID=6
		LogAudioMixer: Display: Starting AudioMixerPlatformInterface::RunInternal(), InstanceID=6
		LogAudioMixer: Display: FMixerPlatformXAudio2::SubmitBuffer() called for the first time. InstanceID=6
		LogInit: FAudioDevice initialized with ID 6.
		LogAudio: Display: Audio Device (ID: 6) registered with world 'TestArena'.
		LogAudioMixer: Initializing Audio Bus Subsystem for audio device with ID 6
		LogLoad: Game class is 'GameModeBase'
		LogWorld: Bringing World /Game/Maps/UEDPIE_0_TestArena.TestArena up for play (max tick rate 0) at 2026.05.24-15.59.50
		LogWorld: Bringing up level for play took: 0.000385
		LogOnline: OSS: Created online subsystem instance for: :Context_10
		LogStreaming: Display: FlushAsyncLoading(896,895,894,893,892,891,890,889,888,887,886,885,884,883,882,881,880,879,878,877,876,875,874,873,872,871,870,869,868,867,866,865,864,863,862,861,860,859,858,857,854,855,856): 43 QueuedPackages, 0 AsyncPackages
		LogTemp: [SpiderJointController] Joint[0] Constraint 'BackLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[1] Constraint 'BackLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[2] Constraint 'BackLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[3] Constraint 'BackLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[4] Constraint 'BackLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[5] Constraint 'BackLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[6] Constraint 'BackLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[7] Constraint 'BackLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[8] Constraint 'FrontLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[9] Constraint 'FrontLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[10] Constraint 'FrontLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[11] Constraint 'FrontLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[12] Constraint 'FrontLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[13] Constraint 'FrontLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[14] Constraint 'FrontLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[15] Constraint 'FrontLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[16] Constraint 'MiddleLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[17] Constraint 'MiddleLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[18] Constraint 'MiddleLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[19] Constraint 'MiddleLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[20] Constraint 'MiddleLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[21] Constraint 'MiddleLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[22] Constraint 'MiddleLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[23] Constraint 'MiddleLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] 제어 관절 초기화 완료. Configs=24, ResolvedConstraints=24, Source=DataAsset
		LogLearning: Display: BP_SpiderLearningManager: Adding Agent BP_SpiderRobot_C_UAID_345A601B0C9B4FDD02_1194554775 with id 0.
		PIE: 서버가 로그인했습니다.
		PIE: 에디터에서 플레이 총 시작 시간 0.174초입니다.
		LogRenderer: Recreating Persistent SBTs due to initializer changes: 
		        NumShaderSlotsPerGeometrySegment changed: current: 1 - new: 2
		        NumGeometrySegments changed: current: 0 - new: 512
		```
		
		
		
		  </details>

		- 출력 로그를 보면 모든 24개의 Constraint 를 초기화 한 것을 확인할 수 있다
		- 생성한 데이터 에셋도 정상적으로 읽고 있다

			```c++
			제어 관절 초기화 완료. Configs=24, ResolvedConstraints=24, Source=DataAsset
			```

		- 즉 `BP_SpiderTrainingManager`가 `BP_SpiderRobot`을 Learning Agents의 Agent로 등록하는 것도 정상 동작 중이야

	### 2.2.11. [BP] Learning Agents Action[24]를 ApplyJointActions로 전달

		- 이제 다음 단계는 Interactor의 `**Perform Agent Action**`** 연결**을 만들 차례다.
		- 즉, 지금까지는
			- Learning Agents가 24개 Action을 출력한다는 구조 정의
			- SpiderJointController가 24개 관절을 제어할 준비 완료
		- 라면, 이제는  `BP_SpiderInteractor`의 `Perform Agent Action`에서 학습기가 낸 24개 값을 꺼내서 C++ 함수에 넘겨야 한다.
		- BP_SpiderInteractor 더블 클릭 → Perform Agent Action

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/ac57ec5d-ac08-426b-be7a-ea27002404b9/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SNP6P4IS%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071911Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCICZCrz5d9tSbOX4fu2q3b%2Brqn96DdZ%2FxpIelFv8LRR2eAiAhSyrKIA1du2NL6Lg0%2B%2F46dDBSSjSQv7blPSWoNQWFUCr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMirBJuMkGgidoX%2BMfKtwD3p3aO6U07zmPKoEQpncS9cZ03RXdKtZiH9or0PDQTNwE8amCdo1tQ%2BUFWcjhaR4k%2Fa%2FWRs%2FpiaiOKC7n5uiM7NJUh%2BNK%2FyOl6Y7sO%2Fn4AjHMsmaWLT66HrtdKfSPRosOAZdo659A7J%2FwIy93AAs3EkY5Hy9h8vaN%2BKYeiAzq%2F2YXo65a2WYpQGCGSY5uhpNv9iEce%2FEA2Xo3HcDGSfk%2BLPHUo5RHi%2Fd%2BI5tZ0%2BeKeXXuahJ8LWavxPle8yaCSyZ2I55gnGujzb7kEnYtiU6ltby9Z4JrLEZfbdEZAmlpdvuspNcM%2Bs0hC23LtdZHT%2BOxRpdEWjkiKTii7QlnrLAI%2FYPLfJGZZyXLbFjRZ1iNB4nXNUAo0%2F9ZVqI8yev7YhaLjhddHyPGK92ZLTTs%2FqUNcHOduCquK6usQLgdWbQH9e%2Bu6XCBPX%2FYB%2FIypedZsdrdYHj3GARSy4an4z83PihAcSsl%2BC3G0eB%2BAhaU7ba2P6URouM0p%2F8bz70uHhvMh3Dj4mcSWZP2aM0CsPD3X8293kOP8Z8DPu2GDyctvfO7%2Fo3q9BeS4Y8HQHjmlB8yKWucO8vNINIzO6E9GUXp8qA%2FVJG4pvy0wjlDjzAbyl%2FAAk4UPK4%2BtAEJIt3l06Iw%2F4LV0AY6pgFi2F9HuDzwLicZ8aNhnNEOiBCyeFw%2FPJoJIsBZ%2Bwx1GnZa4rg1jzYwPdsghw%2Bl1Xyculw%2BNwU3oHMFXib%2BMdYhekeau2yMaKKQQ%2B%2BrmSyCaTXbgTFdUt0JETFeB44qh%2BgnHz%2BH0SjUlpA1cwjM7DDXuFJzyA%2F9oEaM6ZeP3TXOT4x1jaNAqlDfpZfhRb5GeBXifz6TaAr67eMYsmh7PCrw40HW2A6Z&X-Amz-Signature=01b70f620d7f1100b70a500eddfed603c9af4ccfff5984caa85ec7805cfa026e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 해당 노드를 보면 입력핀이 3개 있는 것을 확인할 수 있다
			- In Action Object : 이번 스텝에서 만든 전체 Action 데이터 묶음

				→ 우리가 정의한 24 개 관절의 Continuous Action이 이 안에 들어있다.

			- In Action Object Element : 그 Action 묶음 안에서 어떤 Agent 항목을 읽을지 가리키는 핸들
			- Agent Id : 현재 행동을 적용할 Agent의 ID
		- Agent Id 핀에서 드래그해서 노드 검색(Get Agent)

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/8bf88597-413d-4e30-ba6d-89d0530980c9/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB46666QLK6VW%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071911Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDAHq%2BhyUixXpWgZCLnGXn02yFlSH2ese%2B%2FqxBW33Ux2wIhANxKLkXGMfrKQEE0y%2F0OkqayqAT3LMKPSurfDm0MzVC2Kv8DCHgQABoMNjM3NDIzMTgzODA1IgzC7P8Vlei7DnFOUSAq3AMpjTJlNQNiVMfnR7Mb1el%2F1qepCmtJnAMe3YsLUVGbssc8Orlc8H%2F9MLbs2CluSE0Fun5S%2BvD0Qk2jc9pb6%2FkzKaGSHLmfMWid31MAFWknXvcnW90rDHMBSs5ouqRm58o87qD6ForD%2FUaZ2GGDphPT1UMeCaiNTUbTtRYYpRBSSs801u979IlD%2Fd6WqMMtewslrc0g2toqzCvOgTOZQQK%2Bkl0J%2F5s%2BBTr1uWNa8O%2FDKazzCx8413YRMtMfGrToQ01pmmFhpld3EYUcqtWuhbDZWOG%2BuLjRuChI9WYDElnBeNrmsfOgMWCeopKIBSMWElZ07FikVSzR4F%2F01QSnY3l%2BBMI2MbVGYHGphK2lERPdRsJ29TsBT5JCuvGvzUfuDpiDCZXwP%2ByLHV4q1jl%2FJRvF6xQ2gQGasUQITPz4nMrfS5Ms3uWrjTExxJrNzBI2HDTwHPTzGXzXftwQkz06MvYZUo%2F%2B4yVRjqCRxd8veyf%2BTUSLffIVexAb1uWsN6uWtxdBRV5%2FHRU1T8sxHB3iP4PsalQOD48aBHcCqVkjjHMxHFg9TVWPd3YrnH6DfHbSuD5nqzCF80hO2rQQ3EU557l2nnfGbHZ0EIjaJH0xNzBLPgMLIHm4p8gVCQ1EejCYg9XQBjqkAQiTx9p8vFEagOqhDt66ghTZ41nSrCrXhdWI%2FKNyHcT44xdmIErA%2Bl%2F8fGai9E66Uwt%2BzofOLihaqzUWXZPZoWETT7AShZIuEDFwyX3KWmA9RKDx4zknF%2FfE%2FVkxW0KZ6OkYLGFdwvAM1%2Batxqlie4QkefPDL5PtATv14kVgY5Y0i10MbrrSAYfTT7hOgjv%2FrS9U50IFgSQOeipCcMnBNdVNzPsd&X-Amz-Signature=e7c3357b7debbe669f65e298d0a475e0adac268bd9ec6a2fa2ffea2cf5fa131c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- Get Agent 노드의
			- 클래스 선택 → BP_SpiderRobot
			- Return Value → Spider Joint Controller

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e1cb2334-b594-4025-a1e6-a77b912c41ed/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4665BUAUTUS%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071912Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCYPbRs7WU4KarCRPhHatwgtQEe76e3D42Iw0uJ4gjtYwIhALG2qa8xex02MgiKwn9dTucTsSLJL6ex0gSrXbhfXtfzKv8DCHgQABoMNjM3NDIzMTgzODA1IgzBqY0mSk00s4J2pGcq3ANbNIquEsPg8qy8TiCWQMyDxL6mBSwZax2kT058HhddUjPQB%2FzOBYBneSfDEkf1JUJaq0intXgCQAUnMWUf9pLF2m0z0IoZ%2BmILFxKMSvm1Q0ntxC20xtYPXc6c1VAR9ktr7nHqYB%2BYbXY8h2wwjz4lfcMpLywq5U6ED8KCoLjdB2rIktmVqFMKzUWEiNVZBmRg5sh8ynjLDAy4oV24LWtrRBEgZJ0MyMAUtHJarnNQmhAN3T8emOuy6Y8lAYoVqmc%2FfLPBa%2FshsBa8n1qip0VIJG8BFV3m%2FHv7BZGmylL%2ByCF6Rq3aa%2Fa2eeY4o4pyi9xMfXmeKpD0fWHL6ZeBIdXBsVXhP%2BjG%2FIKe0v1uEwCE0L7S6Q2ri5Jz%2BrYAXdDnMEXLMp95rTy2CVeV8%2Fvb70OApPrxFyb2ZWiKZR1ieuBB%2FumgjpPu7r1QZWAPEQMKKXqy3zJ%2BHfEpB%2BqVrH87ALuS6zPB%2F%2BG%2FHJAQbLcApx6q2oXF4lDEw63pp1rUP8ADBVVmviZNfaMsHrAR0qnm6dbOzjQbXLOvVvv4%2BQ7wgOHOzOqXVu%2FzyU3DCtDAVcvX5bbL1l8P3txubKpwkYbJdkjAr6TG9N9%2FFy5vmHH%2Bjg8MyoqZ%2FVMhyhC%2Bj36OgzCvgtXQBjqkAXgr9RMwRbc5i2TaiGXLKzbW%2F3g1%2BGmWk4HdMmX%2Bds1isX0WwrHBsxJQ2bQVgeXrlDPIrk92%2Fw4zWTF%2FUIVpo%2BlpMb4W3sN%2FmA5g2GNFk%2BueUc2h0wzP%2FwZo7GsxtnHD42F7gcVOI5mVDJBCyX%2F67Gf6dHDISjFr%2B1BAefDmGea%2FwBXeNmhnhkHh15PpbnhMuRIyF%2Btu%2BuZWD6MKCWHNk2ZaoafB&X-Amz-Signature=5fe99154c97efb8c9775df866dcd379f739c282990d6bceaac9104b1933a4b6e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


				우리가 C++에 만든 실제 관절 제어 함수는 `piderJointControllerComponent` 안에 있음


				```text
				ApplyJointActions(constTArray<float>&JointActions)
				```


				그래서 Learning Agents Action 값을 최종적으로 여기에 넘기려면, 먼저 로봇에서 이 컴포넌트를 꺼내야 함


				```text
				Agent Id
				→ Get Agent(BP_SpiderRobot)
				→ Get SpiderJointController
				→ ApplyJointActions
				```

		- `Spider Joint Controller` 핀에서 `Apply Joint Actions` 노드(우리가 C++에 만들었던 함수) 뽑기

			```c++
			UFUNCTION(BlueprintCallable, Category = "Spider Joint")
			void ApplyJointActions(const TArray<float>& JointActions);
			```


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e595f613-6e85-446b-9100-b4aadaf52634/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466TAVUS4DR%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071912Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDCs8%2FCOVAjrVauiIwHmZaL%2BCKum8zLFxqywUqNyxdpoQIgA23beemfQk%2Fe7x8RvAkKqEFiYQKeuykKl%2FNXTWlAi8kq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDFGTTTb44KamIMCMuircA%2BVmT1rkoKCU8mvPubyWHvNzuR3jzZcgN0U%2FAbEOTHxKtay2iyspI1lnkAh7wzNOH4wRQ%2FRqI8CQni7AcVXnwZcgBP8PF%2BdbnG67s3Hol8mPh31ZHaeSbOuftv%2Be8%2F0pLj6WcAf%2B1%2BXg7dIvO%2B%2B7FvkC%2BoHlEvlyEqgUuqGSnE6C1Zng5H6P6NPME0zGpFlKJIqekEPmKCvthXPYzkdheK2SNBl6jg7grk2ognKmpaUuRbwlqXPQPSS5qmSkyklFu9YmOFBSFoweAJ8AKaH%2B23Kq3osmOlr5h9QT40yPnuhEfVd66J9C9SeUPqhL%2FXi%2Bck6mQk2vJ0Dl4AbtLAi2YYgydN80GfwL4bQpL0O8Vmmoe%2FUCnbyMNgr98vW8SGlfF3XNJh6JRk%2FQUmI0GUQC4bsnyaMSdz%2F7brAQ9mYaanSGuGVmYOd0zgTN67bx%2FySC2z5jSiv%2BUDHuOWrKqmuxwU%2FcCetn5zKZPIaSLhnqAo6aaHq9uwv5xpkb6hBwuJSmaA7qFhxdI0NZ60L7qomVU8Yy%2FgGdwUkUB0QJPRmUngHGQpllZmtxZgaUNtC7onI8UjX1sT6K2Zh9znHXoAeX169GykgCirRSYzFs26YkT3JwhLfIo210vzT%2BrtQWMKGO1dAGOqUB6ve7ysJxESvauzNVWQbVlCHhKS6YuOU2EVyNuqZEf%2BjexMeG7HjMupA2MmByMSHYTxCnBLc8ShimbEcj0T0WesRt5w7UA7PnY%2FGTQB72xm4HkQ0ayspE8mmRZrpXVQzNPT37ezbEIH1B3Fu36bJyPzCY1D1GxMRtYoGIbuTYcMDR%2B7hYdtOUOeKcSV8ZShAQEcu5H5eo2IL4TLSQRZ2wBsHZdXXf&X-Amz-Signature=aef428ae50f03ee8522b1f3535c8937a9c8a7dd68682484e406067cdac5369d9&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

			- **이 노드가 하는 일**
			- 이 함수는 우리가 C++에서 만든 관절 제어 함수이며, Learning Agents가 출력한 Action 배열을 실제 Physics Constraint 목표 회전값으로 변환하는 역할을 수행
			- `Perform Agent Action` 함수는 Learning Agents가 매 스텝마다 “이번 Agent에게 이 Action을 적용하라”고 호출하는 함수다.
			- 그런데 지금까지는 함수가 호출되어도 바로 `Return Node`로 넘어가기 때문에 실제 로봇에는 아무 행동도 적용되지 않는다.

				```text
				기존 흐름:
				Perform Agent Action
				→ Return Node
				→ 아무 관절도 움직이지 않음
				```

			- 따라서 중간에 `Apply Joint Actions`를 실행시켜야 한다.

				```text
				수정 후 흐름:
				Perform Agent Action
				→ Apply Joint Actions
				→ 24개 Action을 24개 관절 목표 회전으로 적용
				→ Return Node
				```


				즉, 이 단계는 **Learning Agents의 출력값을 실제 거미 로봇 관절 움직임으로 연결하는 핵심 단계**

		- 현재 Perform Agent Action 함수가 호출될 때마다 실제로 관절에 Action을 적용해야 하는데 바로 Return Node로 가면 아무 일도 안하고 끝나버린다. 그렇기 때문에 중간에 ApplyJointAction을 실행시켜야 한다.
		- 이제 실제로 넘겨받을 24개의 Action 배열을 등록해주조자
		- Perform Agent Action의 In Action Object 드래그 → Get Continuous Action 노드 생성

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/80c71161-460e-4570-9bc7-cabe64583db1/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466ZIWO6ZJX%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071913Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDFl1i29c%2Boj33TzVuiSmzEkXrNEjVYGxdvhnMHGuo3qgIgQU3i3jICQUFwPZyR8oWR%2FtQnYUiYCw0Ukm8OUta5URkq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDI9BgQFLMuMvIL4rFircA91Gf1mQ5%2FaqV7dWHWqQyx0h4Nj7gjqMl%2F8meHqSy72vVQ8y%2F8NNCZQxZFJ7OLYEvK3dBIXuCN%2Ft7q4T5mRQks0SqAF0U870b%2BT%2FhVPhhz9zwDHtpE%2BqeCC3LpLIg0TlYefRg34iTLcd5%2Bw2lgkqpvhdwrd0AdXw%2BNEhfoQBdtMztRfPHmAvVolrwigieJrvi0Fa63y623fWAUNW9%2FoBm6WJ%2FLUbdXlBgUY2qfvTpIBRhOAivKI%2FTM5kh7QUbccgXc%2BhAiO6%2BUA77l%2F1RWeAjfKsRqiQF%2BXWOGBuiFRocQtmaTmNMXj7peTn8p69gA28ts7RpYRQizul3EmC84K0G4uue1%2BcuKqF6qYK5C17jcLyIaDlliTNouYnTMEjvI4kl0I3U3G50dFEaZOKm1yxR1bjGLeqPxZHOuZjo5FmWa7DVbcdxz3iguB5JVnoa%2BvI5c439VPPe4BqaVc%2FKo6Bd6CCW1wIwRSvfV%2B7K3HwsnpNU%2BpgYmG7HiuNJT3KnMmE9PKUuyiqtXm2chx8P3wRQ4x8wNWzJCvhP%2F%2B9nPVBYUZUg4BF%2FJtkwgJoWSEFUxqQIz1VMyltnMA%2BksLfQHir5Rnxzopp6gS6CP6vKUTVbhsRj1FIZ%2B%2BGA2nmwwvUMJiA1dAGOqUBxbMDBBq1e8sYStg1DjbHGYCGEJSdwzpIdNfshbHdBYDpw1pIlhtSCaCmEg3xUmP8ypknPOxikMFbKAOIg17tpVHTUUw3Yg6fs3IB4xbrZQnFNzIZlZAiOBve0pwQ2sX9mnWx3Ef3mxEE0um7knQhbMkOECtY6tSx77qmOaGsQstNr13Zm9qWOSOgWLIGcVxOWw51zjyloAyVmqcQDv3LJN2tWik8&X-Amz-Signature=b59c82f1db5ec9110b6fc19b35184a72af430810e73b18dbcef48875de61d821&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- Perform Agent 출력 핀 연결

			```c++
			In Action Object
			→ Get Continuous Action.Object
			
			In Action Object Element
			→ Get Continuous Action.Element
			```


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/ee7bb499-640b-47bc-9701-1a567ce10d22/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466TYAVHDOG%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071913Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCICn7AaHqxz%2F4XR4lo0YjcDHsJuUbJ1Fm3LbAC4ZTpGVyAiAVNF1oAenZu5kWF8FEMOEckTpUxCrb2caxQdw0znyrGir%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMcjc2J6nv7OWPxO6WKtwD66YPWdSklH3bgswvAnQIRa74XBcYb%2BDuq6hjBSIaRjnIsRl0mHE5GZYxb0gH2umxa7RHRhVHCoFelWz4hYzK9i%2B5O18PdULkgxIU1ohFHMT1xcfasX0jxdqANFHH1xKLJyU%2FUiyfwtU01n0cb0168HiP56lEQwBZ8oj2NAjXchE%2B3qKJ6OSrIaQSbMdkHvIUBzq9uUPv14KBlzFy%2FM3hfuD5gTaZdgeVFpyiDa9aAzbbsNe9FuOVDbUQrhXeJURUO4NrY4tlkTuw%2BCKRcOdMgLz7n6zYl9ss%2FjHQ633sUtvvqlY5OBsRjkNVpz8VpqV1IKtjwWAeQPjzMSD0qSaHm1XXmD3ZryQfQkNKbCu%2F2MlXVqQSbXLVMXLyoEXhXw1Na5ORWbI3zEmrQZHKQeiW6Yudgnyg4kC6VtHLeAkKzSL6cqI9nHmoa8aWlWi%2BskSOTQzrQsaEvrOm5j2uJgr402JqgJT3DETwqZPynxhq4laicTe8jwQUPQ0c5rycqFnqH0l7LL5cguDlKvvNdIEkQD%2BhwRhEG4XDTcTSnxO5%2BizoaVD9QKSQ609fFE32%2F73CzclNKxxj4Is7s4wLX%2B%2F4zcL%2Bfw22GzdMtLf6ZJ2Ul3Wh9dtkgWfjIHIPfIAwzIDV0AY6pgGsCrTjtc3DmUVwCLY7AbXHHjTmPAXD2bfxLWvET%2FR9UuAYNDL2WsEjUyXAlrxNHr7aIvWG1FVXmVOky7UKVp%2BwsYwjiri3meqTeRlf%2B1PWMeyg%2FTl9tSv2kr21sZpIlZMvJ0mT68aCm%2BftTOajRDV%2BoDC%2Fb9%2B5PctOcd%2BXBRC1m2ZKvG%2B7QPhs9n3AK%2BWnqplQFFU6gz1nyzyqg7BSocMQAhv763AK&X-Amz-Signature=f7f60f0b41c0e0dab1cd050ad6de149bcf27e1a659d297d98daaf7fb6f4f31eb&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 실행 흐름도 `Get Continuous Action`을 거치도록 수정

			```c++
			Perform Agent Action
			→ Get Continuous Action
			→ Apply Joint Actions
			→ Return Node
			```


			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/ba425e07-4f61-4e48-8cd8-702142706daa/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SFXBMX7U%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071914Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCw4%2FAury6DigmxO7P93EzVirNiarQAjnjzbkttPjz3AAIgIIZHKF7BICmNIXyCG5xM7Ri5AmXzAIzrl%2FzMxAr6zoEq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDDlkLbKnpFejy%2FHsmSrcA7p5n5cLbB2OnogiIF8slsgQlX4Cv4u%2BIpXwSoD%2FLhXOUHynloRsKmleuH%2FL775%2BkrovWC0uTXJz7QWYdpa3ILgT%2FgSZWzBi9%2BDRFeyfB28s7N7s02GI9IbdfO482uAEHLefAWm3HaV1fKMXro20mbdlyXz8iWL5mGLNk6SiVqc4AbMyGniC85UE2aoJFonLxa2zfmXJhLT%2BDtB3Ra5YJtp3EVdNcFci0jfuFIsYMRMh6vH%2FWqDXyd7ABR%2Fenkly3hGxZWCMiXOFMODNW%2BhNfHIFh7jJ%2FE1Uqr7OgRV1jFZuaPtIPss0jJDLBT5YJVNJZ%2FWGvAEdD%2BkS%2F%2BGTPiTszWF%2BaUmn4MnEZMgQ9v52akpSeRslVQn5rGBfRJic2SfitVDJt0SThbiLBty%2FUuXQ57VZBF6xmzYbEAZw%2FwJe%2FXxnl91qjlCqTd8sQEd9K%2BoQdn0xALMKdQKvDhwWjZQvQfHXJ9ZBDf%2BUz%2Bt5Px%2BWcRqS06MjakZaHSU%2BemjtlKcbdD4%2FPraEjRDbWMYYEPo4hzjN3ARMS8Eu3oDI3I3Tx3w0A427krDLoMCp3mq26OyaGSwps0kQun%2BEuYLu%2F1%2BTeyz9psjCdIXEHJqNw%2FGjmgcvcolxvjFl6%2FFremMQMOKB1dAGOqUBe8iEu0u%2BVug97xxBOYZuS9sNJlJxroX2iypI6ktSkbANm9ncdd7eLHX%2B3xdK2sFyXbggi%2BEDmL72FYRSRfErH8uGIfrj8rq3H6VobBw%2FJ5xjf6JWqrL%2BRA6lxxZSzCIeGfylTAQFw20kD%2Fl00OFqSf8TpV0OGz4AWA5ol%2FSD16fZ7UMkO3fHJVKvF9JcNIyXKhWE3K8agpB%2F6ox9lD8Ll%2FikXEqm&X-Amz-Signature=4ebced4099bf21a96f0f1b816cf241f7ff757aced6cda570b811491978728dfc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

			- `Specify Agent Action`에서 우리는 이미 아래와 같이 Action 구조를 정의했음

				```text
				Continuous Action
				Size = 24
				```

			- 즉, Learning Agents는 매 스텝마다 24개의 float 값을 출력한다.
			- 하지만 `Perform Agent Action` 함수 안으로 들어오는 값은 처음부터 float 배열 형태로 바로 들어오는 것이 아니라, `In Action Object`와 `In Action Object Element`라는 형태로 전달된다.

				```text
				In Action Object
				= 이번 스텝에 생성된 전체 Action 데이터 묶음
				
				In Action Object Element
				= 그 Action 데이터 안에서 우리가 정의한 Continuous Action 항목
				```

			- 따라서 실제 24개 float 배열을 사용하려면 `Get Continuous Action` 노드를 통해 값을 꺼내야 한다.

				```text
				In Action Object + In Action Object Element
				→ Get Continuous Action
				→ Out Values
				```

			- 여기서 `Out Values`가 바로 Learning Agents가 출력한 24개의 Action 배열이다.

				```text
				Out Values[0]  → BackLeg1_L
				Out Values[1]  → BackLeg2_L
				Out Values[2]  → BackLeg3_L
				...
				Out Values[23] → MiddleLeg4_R
				```

			- 이 배열을 `Apply Joint Actions`의 `Joint Actions` 입력에 연결하면, C++의 `ApplyJointActions` 함수가 각 값을 읽어서 24개 Physics Constraint의 목표 회전값으로 변환한다.

				```text
				Learning Agents Action[24]
				→ Get Continuous Action.Out Values
				→ ApplyJointActions(JointActions)
				→ SpiderJointControllerComponent
				→ 24개 Constraint 목표 회전 갱신
				```

			- 즉, 이 단계는 **Learning Agents 내부의 Action 데이터를 실제 C++ 관절 제어 함수가 사용할 수 있는 float 배열로 꺼내는 단계**
		- 최종 형태

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/9397cf92-5f98-4c6e-af06-04bc8d1f6923/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466TFCX5CLK%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071916Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCICsLJQfU2EUoh0ZtSvbhc9FQrwjU3BqvhprJt%2Bm0Mwq3AiBQkwCMG1POeKYtqRyi12EtroOW%2BorAG1%2BV%2FJSyNefGOSr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMZzOk2XgOFeef5aiaKtwDyRwOqweOO6tThqTzR6ywrzzhYaiUpImWY6AsoE3cAAAZQhK7MM6KdfNnOSn59paiBKm2EO8SqGaakLuRTMmZeoAhTLmwBFULspfk%2Bc9bPhAoCmE0dfj3R8EAzv9EZ9gFr2vWMDg34H%2FHbuCxzSdBK3E0qFVboMt0JMic8JHqKZfQPQGDj8lVRCsuXGitb4QsyPXevzAptYjqoMtci1tspuMOU06XVTayFEeaPXEgMBZdXUcGUgvhVkCfzBIdkCQMXVHPtatSNQeybRmfNV9tfPKQEShKs74znkl8aTuacF5F9WxVphfLEw2TkU%2B8ZDwVMCP17Z7ESipXBqWNwvRF%2FtxJxAgXH%2FmESLw8HsopOH1JIa5fGkVm5IQ9cEF4%2F3gzMoSIb9MvH0dCNrlpbZ%2BTWwp%2BGouJNaxhMg4lUln1kd3PBTyxTGpq8MAHkZwvFCwnbwcces1wEEmFNXt7j4lI8ydTZnaH4vKNJ6O%2BHZU4I6JzDa9pAxPBUSVlOR7%2BTJpqxuY4trtDZEzNKnKXS%2BvfS%2BFkiq6XyEAkwUSEG8mySmz5ORACrcK1E3tCK3wuCye6g6qFEHpLWYBWb7AUvW6ph4Gkm5I4YOERpKFCKn5900pl6lN78D8YtOckR5wwuIHV0AY6pgE%2F4Gybfrb6VtzhRPC6r9bAyvS421xZ6FCmbL2RAVCCHMsyIO%2FyFrsNDknwIZKnxc9vRKluIx%2B24IIE58TIC8DDITXH8%2Bxeuqd07%2BiY015aQgicvv%2BQKmCXt5%2Bpi%2BjLj4GwJ5QPPCrD5IRXvnPFIsYs%2BOH%2B7BJ8Md5OjcbbSFF%2BfZaK5Ls9yiw0iQMBrz7tHDei%2FubqXw7dfg1CL89rZQ%2B52WXBRpMe&X-Amz-Signature=596f29f5b1120c802240014c49eed22ca7a757eba847f7ab9af8c6a485be6c4b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- 컴파일 저장 후, 플레이

		<details>
		  <summary>출력 로그 확인</summary>
		
		
		```c++
		LogSlate: Updating window title bar state: overlay mode, drag disabled, window buttons hidden, title bar hidden
		LogWorld: BeginTearingDown for /Game/Maps/UEDPIE_0_TestArena
		LogWorld: UWorld::CleanupWorld for TestArena, bSessionEnded=true, bCleanupResources=true
		LogSlate: InvalidateAllWidgets triggered.  All widgets were invalidated
		LogWorldPartition: UWorldPartition::Uninitialize : World = /Game/Maps/UEDPIE_0_TestArena.TestArena
		LogPlayLevel: Display: Shutting down PIE online subsystems
		LogSlate: InvalidateAllWidgets triggered.  All widgets were invalidated
		LogSlate: Updating window title bar state: overlay mode, drag disabled, window buttons hidden, title bar hidden
		LogAudioMixer: Deinitializing Audio Bus Subsystem for audio device with ID 7
		LogAudioMixer: Display: FMixerPlatformXAudio2::StopAudioStream() called. InstanceID=7, StreamState=4
		LogAudioMixer: Display: FMixerPlatformXAudio2::StopAudioStream() called. InstanceID=7, StreamState=2
		LogUObjectHash: Compacting FUObjectHashTables data took   0.70ms
		LogPlayLevel: Display: Destroying online subsystem :Context_15
		LogDebuggerCommands: Repeating last play command: 선택된 뷰포트
		LogContentBundle: [TestArena(에디터)] Generating Streaming for 0 Content Bundles.
		LogWorldPartition: Display: GenerateStreaming for 'TestArena' started...
		LogWorldPartition: Display: GenerateStreaming for 'TestArena' took 1.370 ms (total: 11.501 ms)
		LogCameraSystemEditor: No camera objects needed building (inspected 0 objects)
		LogPlayLevel: PlayLevel: No blueprints needed recompiling
		LogPlayLevel: Creating play world package: /Game/Maps/UEDPIE_0_TestArena
		LogWorldPartition: Display: UWorldPartition::PostDuplicatePIE started...
		LogWorldPartition: Display: UWorldPartition::PostDuplicatePIE took 184 us (total: 1.262 ms)
		LogPlayLevel: PIE: StaticDuplicateObject took: (0.004292s)
		LogPlayLevel: PIE: Created PIE world by copying editor world from /Game/Maps/TestArena.TestArena to /Game/Maps/UEDPIE_0_TestArena.TestArena (0.004325s)
		LogUObjectHash: Compacting FUObjectHashTables data took   0.67ms
		LogChaosDD: Creating Chaos Debug Draw Scene for world TestArena
		LogWorldPartition: ULevel::OnLevelLoaded(TestArena)(bIsOwningWorldGameWorld=1, bIsOwningWorldPartitioned=1, InitializeForMainWorld=1, InitializeForEditor=0, InitializeForGame=1)
		LogWorldPartition: Display: WorldPartition initialize started...
		LogWorldPartition: UWorldPartition::Initialize : World = /Game/Maps/UEDPIE_0_TestArena.TestArena, World Type = PIE, IsMainWorldPartition = 1, Location = V(0), Rotation = R(0), IsEditor = 0, IsGame = 0, IsPIEWorldTravel = 0, IsCooking = 0
		LogWorldPartition: UWorldPartition::Initialize Context : World NetMode = Standalone, IsServer = 0, IsDedicatedServer = 0, IsServerStreamingEnabled = 0, IsServerStreamingOutEnabled = 0, IsUsingMakingVisibleTransaction = 0, IsUsingMakingInvisibleTransaction = 0
		LogWorldPartition: Display: WorldPartition initialize took 1.358 ms (total: 274.527 ms)
		LogPlayLevel: PIE: World Init took: (0.002779s)
		LogAudio: Display: Creating Audio Device:                 Id: 8, Scope: Unique, Realtime: True
		LogAudioMixer: Display: Audio Mixer Platform Settings:
		LogAudioMixer: Display:     Sample Rate:                          48000
		LogAudioMixer: Display:     Callback Buffer Frame Size Requested: 1024
		LogAudioMixer: Display:     Callback Buffer Frame Size To Use:    1024
		LogAudioMixer: Display:     Number of buffers to queue:           1
		LogAudioMixer: Display:     Max Channels (voices):                32
		LogAudioMixer: Display:     Number of Async Source Workers:       4
		LogAudio: Display: AudioDevice MaxSources: 32
		LogAudio: Display: Audio Spatialization Plugin: None (built-in).
		LogAudio: Display: Audio Reverb Plugin: None (built-in).
		LogAudio: Display: Audio Occlusion Plugin: None (built-in).
		LogAudioMixer: Display: Initializing audio mixer using platform API: 'XAudio2'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Console', Device='스피커(High Definition Audio Device)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Console', Device='마이크(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Multimedia', Device='스피커(High Definition Audio Device)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Multimedia', Device='마이크(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Render Role='Communications', Device='스피커(2- ABKO EH550)'
		LogAudioEnumeration: Display: FWindowsMMDeviceCache: Default Capture Role='Communications', Device='마이크(2- ABKO EH550)'
		LogAudioMixer: Display: Using Audio Hardware Device 스피커(High Definition Audio Device)
		LogAudioMixer: Display: Initializing Sound Submixes...
		LogAudioMixer: Display: Creating Master Submix 'MasterSubmixDefault'
		LogAudioMixer: Display: Creating Master Submix 'MasterReverbSubmixDefault'
		LogAudioMixer: FMixerPlatformXAudio2::StartAudioStream() called. InstanceID=8
		LogAudioMixer: Display: Output buffers initialized: Frames=1024, Channels=2, Samples=2048, InstanceID=8
		LogAudioMixer: Display: Starting AudioMixerPlatformInterface::RunInternal(), InstanceID=8
		LogAudioMixer: Display: FMixerPlatformXAudio2::SubmitBuffer() called for the first time. InstanceID=8
		LogInit: FAudioDevice initialized with ID 8.
		LogAudio: Display: Audio Device (ID: 8) registered with world 'TestArena'.
		LogAudioMixer: Initializing Audio Bus Subsystem for audio device with ID 8
		LogLoad: Game class is 'GameModeBase'
		LogWorld: Bringing World /Game/Maps/UEDPIE_0_TestArena.TestArena up for play (max tick rate 0) at 2026.05.24-17.07.11
		LogWorld: Bringing up level for play took: 0.000510
		LogOnline: OSS: Created online subsystem instance for: :Context_16
		LogStreaming: Display: FlushAsyncLoading(983,982,981,980,979,978,977,976,975,974,973,972,971,970,969,968,967,966,965,964,963,962,961,960,959,958,957,956,955,954,953,952,951,950,949,948,947,946,945,944,941,942,943): 43 QueuedPackages, 0 AsyncPackages
		LogTemp: [SpiderJointController] Joint[0] Constraint 'BackLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[1] Constraint 'BackLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[2] Constraint 'BackLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[3] Constraint 'BackLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[4] Constraint 'BackLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[5] Constraint 'BackLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[6] Constraint 'BackLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[7] Constraint 'BackLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[8] Constraint 'FrontLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[9] Constraint 'FrontLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[10] Constraint 'FrontLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[11] Constraint 'FrontLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[12] Constraint 'FrontLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[13] Constraint 'FrontLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[14] Constraint 'FrontLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[15] Constraint 'FrontLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[16] Constraint 'MiddleLeg1_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[17] Constraint 'MiddleLeg2_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[18] Constraint 'MiddleLeg3_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[19] Constraint 'MiddleLeg4_L' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[20] Constraint 'MiddleLeg1_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[21] Constraint 'MiddleLeg2_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[22] Constraint 'MiddleLeg3_R' 초기화 완료.
		LogTemp: [SpiderJointController] Joint[23] Constraint 'MiddleLeg4_R' 초기화 완료.
		LogTemp: [SpiderJointController] 제어 관절 초기화 완료. Configs=24, ResolvedConstraints=24, Source=DataAsset
		LogLearning: Display: BP_SpiderLearningManager: Adding Agent BP_SpiderRobot_C_UAID_345A601B0C9B4FDD02_1194554775 with id 0.
		PIE: 서버가 로그인했습니다.
		PIE: 에디터에서 플레이 총 시작 시간 0.195초입니다.
		LogRenderer: Recreating Persistent SBTs due to initializer changes: 
		        NumShaderSlotsPerGeometrySegment changed: current: 1 - new: 2
		        NumGeometrySegments changed: current: 0 - new: 512
		```
		
		
		
		  </details>


# 3. 후기


정말이지, 그냥 영상으로 보는 것과 그걸 실제로 구현해내는 것은 정말 완벽하게 다르다는 걸 새삼 느끼게 된다. 

