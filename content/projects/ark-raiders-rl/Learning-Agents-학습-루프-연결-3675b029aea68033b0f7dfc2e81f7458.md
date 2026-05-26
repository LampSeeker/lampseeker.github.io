---
title: "Learning Agents 학습 루프 연결"
date: "2026-05-21T12:59:00.000Z"
lastmod: "2026-05-26T01:44:00.000Z"
draft: false
status: "Public"
tags:
  - "2단계"
authors:
  - "조현근"
NOTION_METADATA:
  object: "page"
  id: "3675b029-aea6-8033-b0f7-dfc2e81f7458"
  created_time: "2026-05-21T12:59:00.000Z"
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
      created_time: "2026-05-21T12:59:00.000Z"
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
            content: "Learning Agents 학습 루프 연결"
            link: null
          annotations:
            bold: false
            italic: false
            strikethrough: false
            underline: false
            code: false
            color: "default"
          plain_text: "Learning Agents 학습 루프 연결"
          href: null
  url: "https://www.notion.so/Learning-Agents-3675b029aea68033b0f7dfc2e81f7458"
  public_url: null
  archived: false
MANAGED_BY_NOTION_HUGO: true

---


{{< notion-unsupported-block type=table_of_contents >}}


# 1. 소개


  이전 단계에서는 `BP_SpiderInteractor`에서 학습기가 출력한 24개의 Continuous Action 값을 가져와 `SpiderJointControllerComponent`의 `ApplyJointActions` 함수로 전달하는 구조까지 구현했으니, 이번 단계에서는 지금까지 구성한 **Learning Agents 입출력 구조**를 실제 학습 루프에 연결하기 위한 기반 작업을 진행해보도록 하자

- 현재까지 구성된 흐름은 다음과 같다.

	```text
	Learning Agents Action[24]
	→ BP_SpiderInteractor.Perform Agent Action
	→ Get Continuous Action
	→ SpiderJointControllerComponent.ApplyJointActions
	→ 24개 Physics Constraint 목표 회전 갱신
	```

- 또한 `DA_SpiderJointConfig`를 통해 24개 관절 Constraint 설정을 별도 Data Asset으로 분리했고, 실행 로그를 통해 모든 Constraint가 정상적으로 초기화되는 것도 확인했다.

	```text
	Configs=24
	ResolvedConstraints=24
	Source=DataAsset
	```

- 따라서 이제 다음 목표는 `BP_SpiderTrainingManager`에서 `BP_SpiderInteractor`를 실제 Learning Agents Manager에 연결하여, Interactor의 함수들이 학습 루프 안에서 호출될 수 있도록 만드는 것이다.
- 이번 단계에서 다룰 내용은 다음과 같다

	```c++
	1. BP_SpiderTrainingManager에서 Interactor 생성/등록
	2. BP_SpiderInteractor가 실제 학습 루프에 연결되는지 확인
	3. 이후 Observation 구조 정의로 넘어가기 위한 준비
	```


	정리하면, 지금까지는 **Action을 로봇 관절로 전달하는 통로**를 만들었다면, 이번 단계부터는 그 통로를 Learning Agents의 실제 학습 실행 구조에 연결하는 작업이다.


# 2. 작업


## 2.1. `BP_SpiderTrainingManager`현재 상태 확인


	### 소개

	- 먼저 `BP_SpiderTrainingManager` 블루프린트를 열고 현재 구성된 Learning Agents 관련 컴포넌트와 BeginPlay 흐름을 확인한다.

		```text
		BP_SpiderLearningManager
		BP_SpiderInteractor
		BP_SpiderRobot
		```

	- 여기서 `Manager`는 학습 대상 Agent를 등록하고 관리하는 중심 역할을 하며, `Interactor`는 Agent와 Learning Agents 학습 루프 사이에서 Observation과 Action을 주고받는 입출력 인터페이스 역할을 한다.

	### 2.1.1.`BP_SpiderTrainingManager`의 기존 BeginPlay 흐름 확인

		- 열어서, 블루프린트 그래프를 확인해보면, 이런 상태다.

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/0dcd6b45-a607-4370-bf9d-9623771b7b18/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466UKQAXZO7%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071822Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIH0IV4lFelN4rQR6GarYLO3kv17%2Bq2Lj2%2BWmwbo%2FNts6AiEAq42v1x0NN1o3uob88hFl5lUyRD2XB071GLM6YIJwz%2FIq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDA7XjOYdEceraByNqyrcA7pJV%2FWGhR4iWpstoMZwehnrNErbD%2FqkoNr19TWcN0iPqgQVd41NJZytjWr6OSW4dT46oUT89C4OOPckgVq5yzhwikmDKKlNtCySNdH8qDD%2F%2BUEZFHa6QN8eyw7jgXI%2FUeguEFjRCDHjDQ7GiSxBGNd%2FpBvDqfxmffhQbeNBvjjIGqLoUVwm9oYUEizNUXFf7fnFCuVNweEV0Afxdo2TlSC5%2BKTb%2Fr5bU%2BU38LwJ6LpKMcyg7IK1il%2F5281RKfAFB5D7F7ymEC7%2Bf7DSfLhJiUzNi7fqfC1WxJugzkxoKx5Z7HjkzGdAEczU9ZlITPk%2Bq%2B5eryfy4V0y%2B89OzP2kFHvTNwZzbLwnSf3KtKDuM%2Fnlx%2FHD%2B%2B7wx5C%2BZo5ClKCE0qm41w3SUvHCJVt2%2B%2BAtiu8nb%2BLmi9kpRE51URS%2FZvrCdYL3F0qrjhBAmfH4nv3ZBjc59cJGzSzhhviN0lxldxVNDdwVoejcZCGXWVGupux9OsoesDilAUinwNCeaRbLLNjsemGNtDxZnOSc1tGjrhKXvGjKau4l%2BB6%2BjQeERghvFXDpv8vo9Dlug083HnONyUtM9rmikCqdP8Ofk9g11pMq6X2rc%2BRYg50dfBS0neNeeF5SM81eB0fBDX4SMN2A1dAGOqUByC4m1DB53Vm3FQZJxgWD%2FJJeh0anQ4hZ92fQGB1K%2FoSzM8xhdRsh0nClyUq3ZOarf04tig3YgBOKhPyIUQg1rDVa1xizZYMar7ULlSkO%2BOqgFkvBMic0xQMFWlfhpgQUA4YHwVlYRdoasvdUlarWgkFhcfPpI7StEvmYNAhayO%2BoZf62azxEsbV4JNUtExPiuaMKc5sk%2FOYd2Y9gAfeyPZddHO91&X-Amz-Signature=f9d1dee88100dd147a2945355629eb894f88a219670c96d6e2631c987fe93038&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- `BP_SpiderLearningManager`

			```text
			Agent 등록
			Agent ID 관리
			Interactor / Policy / Trainer와 연결되는 중심 역할
			```

		- `Get Actor Of Class`

			이 노드는 월드에서 특정 클래스의 Actor를 하나 찾아오는 노드


			```text
			Actor Class = BP_SpiderRobot
			```


			그래서 월드에 배치된 거미 로봇 하나를 찾아서 Return Value로 넘긴다. 다만 주의할 점이, Get Actor Of Class는 해당 클래스의 Actor가 여러 개 있을 경우 그중 하나만 반환한다. 그래서 나중에 여러 마리 학습시키려면 이 방식은 추후에 수정해야 한다. 하지만 지금처럼 **로봇 한 마리로 연결 테스트**하는 단계이기 때문에 일단 그대로 두기로 한다

		- `Add Agent`

			이 노드는 Learning Agents Manager에 학습 대상을 등록하는 노드. 즉, BP_SpiderRobot을 Learning Agents Agent로 등록한다는 뜻이다.


			```text
			Target = BP_SpiderLearningManager
			Agent = Get Actor Of Class의 Return Value
			```


## 2.2. `BP_SpiderInteractor`를 연결해야 하는 이유

	- 현재까지 `BP_SpiderInteractor` 안에는 학습기가 출력한 Action 값을 실제 거미 로봇의 관절 제어로 전달하는 흐름이 구현되어 있다.

		```c++
		BP_SpiderInteractor.Perform Agent Action
		
		→ Get Continuous Action
		
		→ SpiderJointControllerComponent.ApplyJointActions
		
		→ 24개 Physics Constraint 목표 회전 갱신
		```

	- 즉, `BP_SpiderInteractor`는 다음 역할을 담당한다.

		```text
		학습기가 출력한 Action 값을 읽고,
		해당 Agent ID에 대응되는 BP_SpiderRobot을 찾은 뒤,
		SpiderJointControllerComponent에 Action 값을 전달한다.
		```

	- 하지만 `BP_SpiderInteractor` 블루프린트 클래스가 존재한다고 해서 `Perform Agent Action` 함수가 자동으로 호출되는 것은 아니고, Learning Agents 쪽에서 이 Interactor를 사용하도록 Manager에 등록해야 한다. 등록되지 않은 Interactor는 함수와 로직을 가지고 있더라도 학습 루프에서 호출되지 않는 고립된 객체가 되기 때문이다.
	- 따라서 이번 단계의 핵심은
		- BP_SpiderTrainingManager에서 BP_SpiderInteractor 인스턴스를 생성하고,
		- 이를 BP_SpiderLearningManager에 Listener로 등록한다.
	- 그래서 최종적으로 만들고자하는 구조는 다음과 같다

		```c++
		BP_SpiderTrainingManager
		│
		├─ BP_SpiderLearningManager
		│   └─ BP_SpiderRobot을 Agent로 등록
		│
		├─ BP_SpiderInteractor
		│   ├─ Action 구조 정의
		│   ├─ Observation 구조 정의
		│   └─ Perform Agent Action에서 관절 제어
		│
		├─ LearningAgentsPolicy
		│   └─ Observation을 보고 Action 출력
		│
		└─ LearningAgentsTrainer
		    └─ Reward를 기반으로 Policy 학습
		```


		현재 단계에서는 이 중에서 `BP_SpiderLearningManager`, `BP_SpiderInteractor`, `BP_SpiderRobot Agent 등록`까지 연결하는 것이 목표다.
		



## 2.3. `BP_SpiderInteractor` 인스턴스 생성

	- BP_SpiderInteractor는 BP_SpiderTrainingManager의 Components 패널에 직접 추가하는 Actor Component가 아니다.
	- BP_SpiderInteractor는 Learning Agents Interactor를 부모로 하는 별도의 Blueprint 클래스이므로, 실행 시점에 사용할 Interactor 인스턴스를 생성해야 한다.
	- 이를 위해 BP_SpiderTrainingManager에  BeginPlay에서 생성한 `BP_SpiderInteractor` 인스턴스를 저장하기 위한 참조 변수를 추가해야 한다

		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/db9e43b3-9aa6-443b-90d2-f8a78220618c/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663ASCWC4R%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071825Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIDhBWHD%2Bk1x0jZj2SCouLiZDlyH104qik87jir1h4aL6AiAUkDnm3VlUk5yBHJA4St8lIozLhKlZgY7ve0wErocRwCr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMMEFgdnfPVm52v%2BbeKtwDr3%2BtbkEVFQL7zC%2FL6vt4JDe4M8Ls8Wlzf5V7L%2BJEkZCOoGzcj7Xs%2FgClwqpmDcIrkj%2FNxWQp%2Bf0q0WnvmhpwIuvJbAWVXj15yZJTjcFEbVR1QfsScrQzXiMpotuDuvSZ1TFA%2FUeUQ%2F8GZeCDy3xAweOMjVyopkh7nzWz4hrXn3NTNLb0K2xZaN%2FG00Cfy%2F%2B1twstmmlG%2FQYvzAegWDmHsTfQQjxkAHS3J4pUWmg2Ypqh56JfnwvFppOUfkLnRtZ55uajCadz%2BffO765sDU9PW1sPqO2ndEgSu3kjLHD5tfNLULGUNvmHsQmr4MP%2FjfCL%2FvWr0GC7j%2Fl5fxVhlKV3kXVGgzyt2tsgWREyI7b%2B%2Bnhu4Hwjhynp6b8JmGBUGggG%2FipKUdvqhbmKamFB4HQ9ItnVJo6j06M0QhcFmvNhH4f43u1dxTzPUDaQZxaDQmYptJ3VcIbbKjhWoWs5bC6nIhZkyAySrAqF61jICc2JnS1rN%2FWUZlNKgdH5XG16nWyhFjNTon6Vudiq49eIyxGtZdqcNDgY83HuYHj5skRPOukh0WXfm52NMgz1sCZMPLAakY1HAQzDjyH5LbaYEjvJrYln4HgLkoOaqr%2Br%2Bw3KCV50BDga%2F0GWerD9QhEw8IHV0AY6pgEwKe%2FTWZ61KhPKxt9AdrJqzcwpumY8Fvdf%2FpMpPs57%2FjGWgtQrdd1Wo00daoBTik1Af8GJId4RRXFF7bO3PfW6DjbpUIBsOck1xQlrEH7zTixNw8kV0Lcq%2Be3MIcZYPm8jyDylYluLyfcwPLgkHcKv9Tb7KYbJ3xrsFRi4ZXroNITP4MHX8CJ%2Bz%2FhOpHYfM1pBdtg65VT1btA7iusH89A1fs9QZx7t&X-Amz-Signature=0a55fabce46848c643a161118b6dd4bdc90b76cdace8464b189516c4c6f0e2c5&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		```c++
		SpiderInteractor : BP_SpiderInteractor Object Reference
		```

	- BeginPlay에서는 다음 노드를 추가한 후 이렇게 설정해주자

		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e73d063e-b85c-4044-8c58-6ed79284fb84/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663CL4HYQ6%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071825Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIEf%2BZFOFy8mKKjZ1jMHWBEvFaedaRax1ygQhEesUSYMpAiA7iqotSfJN%2FTmuFUKGZACMIM1PD8JzcFCY0Ncbh6%2Bs4Cr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMlr1hOcLIKbAxSxQxKtwDPpEyNoQib7TTKKc9W6Lk1kvRMMfobM9slfAYvTPhDhfer44trBemhhCG7eR9GY0B2w9iAH85feTt1yLro2jDAe%2FwoSV6lVPsDX4MooTuzMp9IfipeFS3gm9RgW9l0I%2BITYNjBaEHx7IP0eFiVcMp9B6Y73rW2E2cME859a9NQ7K%2FXG4%2B3dn%2BLVc8%2FajPB7G4KLPsFzCxzmvIkwTc5fYB3bnJjsDAJw%2BpCbUahmSJjq7HfA757fao0rscqbPR48nzT2GIlvqx7iX7bKqumaH3phxl91EDH%2Fhf6TS9KHitgilmVzleFr%2B6M%2FaF29wb3R3v53cVFcahOW5iuQYaXBtkkb3sbYowHa3edLIUGTsnzEcz2NxbP0YoJDqZQPDmDTadIn5UGAHEzmwrBdg2%2Bg0RGlay1jzB9udkCi2yKaheobtrXtSall%2BEDXmP1vba15RiahEuWPtRy3RkCIWdvGhkyspDgjTaksSsmirmhl13Nm%2Bc2Fe8h%2FwGixMAszQDFJZ5RVDd9%2BM04FZ3lcg%2Fl3Pas%2FSpmARznt35Rd84pgwP5rmZT%2BPJael6XrhXYmNOdYPrpV7JZqFnNlJBkhGSs37XJRDbB9ejS0mWr83JccD12O8ApodH6y8vlcIRU00wr4LV0AY6pgH5fOUwjXf1u56EIUaENvn%2F8TE8ci6dH6Ao2sXMV7VMH%2F4PkGHbxpTiMxyfV1F1hxnvCfGdtwrjL4V%2FZHKfbOmM1raYXFkrydN1zJ3kFGxclf7hjszpeGRK1MvfU%2FWiTtKItG4apeVhKvPcUwF0S4hl4yGm8S5%2BnGPzUy0cNJkISVLvjZz8w7fB4K%2FvPT5GuNCrKoAeKOgKI6MhJIMEKxbIJvPqwpp6&X-Amz-Signature=f7b414b10f46f990835d2a6db817c3a59d521a78ab9a7235df2024fc97a689d7&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

		- **Class = BP_SpiderInteractor**
		- **Outer = self**
	- 그 다음 생성된 `Return Value`를 `SpiderInteractor` 변수에 저장하자

		```text
		EventBeginPlay
		→ Construct BPSpider Interactor
		→Set SpiderInteractor
		```

	- 여기까지의 의미는 다음과 같다.
		- BP_SpiderInteractor설계도를 기반으로
		- 실행중 사용할 실제 Interactor 객체를 생성하고,
		- 그 객체를SpiderInteractor 변수에 저장한다.

## 2.4. `Add Listener`로 Interactor를 Manager에 등록

	- 현재 구조에서 BP_SpiderInteractor 는 Learning Agents Manager의 Listener로 동작한다. 따라서 Add Listener 를 통해 Manager에게 이 Interactor를 사용하라고 알려주어야 한다
	- `Set SpiderInteractor` 노드의 실행 핀 뒤에 `Add Listener` 노드를 추가한다. 그리고 `Add Listener`의 입력 핀을 다음과 같이 연결한다
		- Target   =BP_SpiderLearningManager
		Listener =SpiderInteractor

			![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/9cc64230-7bbc-46ce-ae09-f117314d4219/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SZLQASUJ%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071827Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCi8L%2FBH8CTdTJgxBprAcmdZHrpN2RxhPNfgJvQSrkEwwIgIR3NsiVo%2F1Z9L9bLst33Bb2RNOpxhoJG788MjXDDLwUq%2FwMIeBAAGgw2Mzc0MjMxODM4MDUiDOANgWQLtf7W9FdYZSrcA6iO34GCQlmneDMpJC1vpiRoEkoOM19D5pv4MR0nTVdKo9alOqFvm1YwQTri2BzNQxcKaKDjzTmUPJA1Njc%2BCWZyEUWmH%2Boqo5IY7zyq4v0pgr3jMu6%2BpcaTO8d0tSOIRpvqFY7R0c3kpsjesHlCWk76AX6JjmJRJbzSXTzxIH7K%2FwADl4miganxkA2Qisum122dbhtTp8vN8h94ybK85Hw2TEl8dWEDKW281vZor2mKIQljRp3ynJ78r5eqVYSd0uRBbhQfOWL7WPhq7KCedIAvoFm%2Ber6mk%2FBHqpVWX9X5ucFgNnoZokdkmNjLa6SFoLNUZr%2FG5uxYgHscWDc4hs%2Bx8xAtKW1MkK6sAszt2banQuHVB1jd4g2dMhrbUmZ%2FvlMLB1DEYYUbEMj5M%2BMSW58q6vKhSgBbZ7zPhG1VKhYYfKYd5Td8BEBT5YLygj2benr4%2Fav6aY9Wyt9vdNzyre4cjxNKsKgLptxpuvtLFabRPdcqai%2FpvOlbSPCrhgALtV2srrY8UNvZGSBdAgEMxQOhdZ9enZWn2zWfu7SBddFpmVynkWxJ79h0rBxRcwz9%2FJaAj75peGO8kbqSSGrOBrwUlLqFXoQpMR%2F%2FjsIt4E0lypr956vgOLBkmisUMOSA1dAGOqUB%2FBkGI6Q%2Byo%2BzNdAVWgDs28yejHHe5Tf%2FTsnD%2FyqsTiiZfAfxoCDI9g5pyXD0lkE9Bs9puG4qfDa2QHBfZOPwN63%2FynK09wjip%2BWCxSF1CAnVObnGhv39kSnjNlngD4aRcbR3CJTrFxO47Zn44QCCLjIMvK%2Fg2IwJbnSH8RCyBoECHUZGsJODu3pPPck1ZWqfv1enWaDsnLyALHZs86%2FMNlXwY9V0&X-Amz-Signature=fb7c485d38c510d9f5b482da59685e9d28d9196dc33f6ac50f0f12d8001efa66&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		그리고 `Add Listener`의 입력 핀을 다음과 같이 연결한다.

	- 이 연결의 의미는 다음과 같다.

		```text
		BP_SpiderLearningManager에 등록된 Agent들에 대해
		BP_SpiderInteractor가 Observation/ Action 처리를 담당한다.
		```


		따라서 BeginPlay 흐름은 다음과 같이 구성한다.


		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/e90dcae7-be55-4772-bed5-1ec6477071b6/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466S7T6LQRX%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071827Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIF13XlZY7sbdE2KU7jrvlR5hcu5zn7O4T%2BgiwJ%2BQAbtMAiAF7Rud%2B39cgvVJ2wJZUZRtdp3x2Kbv9Mqy5AaHGj%2Bt4Cr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMzcjzg7CEp9p1tB00KtwD3UNY%2FejV%2FoDEKh1j03FCUKgmOlVZ4cI7N1cRTjMuwZyW73VYLuRSPYD1zBl8VZg0k2KVJlG8%2BiGR6Ql7ed9uv0%2B2chm94gy6st%2FjgJbSk81jGKbU0NNis4uiVhxA%2Byzk3rIsVCDR%2FfbDLcWMHtGcFbiphsD7ShZzUfa6BJyUdIXusYBRgpvpnOctM6nxT2n1NV6MLTknaYYDb4EkVm%2BfmQJnbrmV7BLADAWHIeYbYgry%2FAd9DKO6W7HnkcqmhTJcGPdgHazhEn9rIf%2BV0muZ4ly%2F9qvEC%2FpmywBhG9P8hZx%2BuguO3VDkf3UVFbl11wHTx1qc6CyE3t%2BOc99HrJ%2Fg9CuFdCCmwV0RmiIW59JOv65s6YPio9tcXnHdd6FCDD5lqHyWyT7wFOSH19sVeqdEHYYfMnfcnUoTlu4XNVb8KKSub0BeXCM0%2Flh%2BK5M%2FjIVSVtwiEGUS4S5%2BrR93icNXAA%2BG4MnUMPrdDBHyZbs%2FoizKzeOX0PBxd4hX3Y77sl2MePjVrGlhCGCfWaeMUCpMtIYbOmtaEgOaKD%2BbA6kphXtFRRkhOSvjGmdfB6OLmxQQ1Y6H1SJLTqoOkcT5i%2BPjB8qVtUnfq1clohUGHO%2FCfyav8r%2F%2F7XRHI8jxtqQwrIDV0AY6pgFpJ88b6baPR%2B4A8NWTtIYDs6%2FQlnRftS3mC80OSd%2BdgJokpZOCMcS10pvtjjIjFCUmd0noCFy471Z%2Bp0nDm%2FNhOw5EokFYn9oxjkv3Lg0Zxd52be%2BYYngb9E7c3iO7v%2FzSdI58JlR7BDOioBj0sNgMNH5RidTFw5E0%2Bbez3c43KxDvdbx9882bHKvwALuVA7z7nB65hyJHSoty8zYBiw2o3KRsAIjx&X-Amz-Signature=3200cfdae5f0ea69b1e93a77ea5b6b7bfe8a1945c753204c0c148b55174c8cfc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		```text
		EventBeginPlay
		→ Construct BPSpider Interactor
		→Set SpiderInteractor
		→Add Listener
		-Target   =BP_SpiderLearningManager
		-Listener =SpiderInteractor
		```


		이 단계가 완료되어야 `BP_SpiderInteractor` 내부의 `Get Agent` 노드가 Agent ID를 기준으로 실제 `BP_SpiderRobot`을 가져올 수 있다.

	- `Add Listener` 오른쪽 흰색 실행 핀을 잡는다.
	- 기존 `Get Actor Of Class` 왼쪽 흰색 실행 핀에 연결한다.
	- 기존 `Get Actor Of Class → Add Agent` 연결은 그대로 둔다.

## 2.5. 최종 연결

	- 최종 BeginPlay 흐름은 다음과 같다

		![](https://prod-files-secure.s3.us-west-2.amazonaws.com/e844d0ae-7032-4360-9851-f72d6f89619d/21ec76a9-dfd5-4101-a153-b37233ad9dc4/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SIKVTBSH%2F20260526%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260526T071828Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIHblVD8SVdpeDLCGXCIgJhQjd%2BuJfm%2F5e1ZXqjzzXluiAiAvd1oTLWB8705WK5cCRPuy5IveytYbtgCufmC%2BpqnTjSr%2FAwh4EAAaDDYzNzQyMzE4MzgwNSIMVT0T%2FENq3ogjF8WBKtwD2JmOWnLpARdhATzbgmc6P3o62OGFOMOATI6cS7P4RfwG2LLJrzjiPcYXzhCFqc1sAleUNZDDnrQGQ%2FYFReNAAtnXy048US4lpQk1dvdFBm6SCTdQn1T4aX6cvWrSoHgr0fMiRNDfTn7yMLRDHUpIwg6zZc8PmnGqi3PM2PsZaAjZG7H0CgAhFwUrl2%2BAfWDs87vwbCUHUskNeDN03pRpxJ5oPD9ZqztMRMrY7v8l3%2BsvmZa7dNMdu0y4wIqxw0N3E0dQBlvTxp%2FSdJxUN9gbYlInw0oASSqXor%2BU6V8GE6Safv1yZNGPmW%2BLY9oHDlRkqLSodNbo58rEzgdwM8z7xVHmFIr78WFjge5SfKNb9VjLZze70fwNHv8YaRXrLXKyUl5PXJvwTUVlclc5hdLBGSlRBmZhrKMVCwzVqdQUfAQ8O8K2Ekb5EartrSV4KWTEfpy%2Fubk89q495QZHiUuVKP%2BBBXLYrsyBCct1iCXy1TYq%2B9OooNZzGcP72aIU6ptNqBGsY%2BjH%2Fh3z7DNYUaPiVMfnZwibXtNc6Nf%2Fq97mia5FpmaiRlescroYYL3HM6gfbeLQz%2FCnx6v%2Bu7dthT%2FbSBQQXlfnOKnFrt4SfP1OuonJrf8JpQjOeDP21mswooLV0AY6pgG9szXP1l8pr3q%2BMWmuIdtXQHcDldreLYORKYIY7d0UoVYEqd3aW%2BTaWHtcDRTemDAOGuOCYvK6pdObVYYMW8IFGRVOO%2By1JHarE6FZ1Iwye1c10%2BNbL6Vy4qQecLja6jdNkouTPiQX05e3q71lCpFR2C%2F1qwpwC07fdVezBSDYugPGOiyhpMEw2EPGVtghzxgQyHbaiN%2BJ%2FgF8xEJa%2FmFxjTRVCeUu&X-Amz-Signature=443896214bb139906eb2fe4805abfecf1195b84f056bed8e649f3350ae17f2ed&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


		```mermaid
		flowchart LR
		    BeginPlay[Event BeginPlay]
		
		    Construct[Construct BP_SpiderInteractor]
		    SetInteractor[Set SpiderInteractor Variable]
		    AddListener[Add Listener]
		
		    GetRobot[Get Actor Of Class<br/>BP_SpiderRobot]
		    AddAgent[Add Agent]
		
		    Manager[BP_SpiderLearningManager]
		    Interactor[BP_SpiderInteractor]
		    Robot[BP_SpiderRobot]
		
		    BeginPlay --> Construct
		    Construct --> SetInteractor
		    SetInteractor --> AddListener
		    AddListener --> GetRobot
		    GetRobot --> AddAgent
		
		    Manager --> AddListener
		    Interactor --> AddListener
		
		    Manager --> AddAgent
		    Robot --> AddAgent
		```


		```mermaid
		flowchart TB
		    TrainingManager[BP_SpiderTrainingManager]
		
		    Manager[BP_SpiderLearningManager<br/>Agent 등록 / Agent ID 관리]
		    Interactor[BP_SpiderInteractor<br/>Observation / Action 입출력]
		    Robot[BP_SpiderRobot<br/>실제 물리 거미 로봇]
		    JointController[SpiderJointControllerComponent<br/>24개 관절 제어]
		
		    TrainingManager --> Manager
		    TrainingManager --> Interactor
		    Manager --> Robot
		    Interactor --> Robot
		    Robot --> JointController
		
		    Interactor -->|Perform Agent Action| JointController
		```

