---
title: "언리얼 + Learning Agents를 활용한 드론 강화학"
date: "2025-08-03T14:23:00.000Z"
lastmod: "2025-08-03T14:29:00.000Z"
draft: false
태그: []
authors:
  - "조현근"
NOTION_METADATA:
  object: "page"
  id: "2445b029-aea6-8068-92d5-da0c75267afe"
  created_time: "2025-08-03T14:23:00.000Z"
  last_edited_time: "2025-08-03T14:29:00.000Z"
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
    data_source_id: "10a28b93-22b7-42d7-81c7-7d0123bc1ba7"
    database_id: "92b3f165-8e02-49ca-9c68-b7996c2dbaeb"
  in_trash: false
  is_archived: false
  is_locked: false
  properties:
    태그:
      id: "exW_"
      type: "multi_select"
      multi_select: []
    생성 일시:
      id: "gqb%3E"
      type: "created_time"
      created_time: "2025-08-03T14:23:00.000Z"
    관련 링크:
      id: "y%60U%7B"
      type: "url"
      url: null
    이름:
      id: "title"
      type: "title"
      title:
        - type: "text"
          text:
            content: "언리얼 + Learning Agents를 활용한 드론 강화학"
            link: null
          annotations:
            bold: false
            italic: false
            strikethrough: false
            underline: false
            code: false
            color: "default"
          plain_text: "언리얼 + Learning Agents를 활용한 드론 강화학"
          href: null
  url: "https://www.notion.so/Learning-Agents-2445b029aea6806892d5da0c75267afe"
  public_url: null
  archived: false
MANAGED_BY_NOTION_HUGO: true

---


## ✅ 1단계. **목표 정의 및 기능 범위 확정**


> 프로젝트 전체의 범위를 명확히 정해두는 단계입니다.

- **핵심 목표**:

드론이 실내 공간을 자율적으로 탐색하고, 사람을 인식한 후 해당 위치를 지도에 마킹

- **세부 기능 분해**:
- [ ] 드론 자율비행 및 장애물 회피
- [ ] 미탐색 구역 탐색 알고리즘 (예: 랜덤 or 그리드 기반)
- [ ] 사람/객체 인식 (Tag, Trigger, 시각 모델 등)
- [ ] 맵 생성 및 시각화
- [ ] 결과 로그 및 UI 표시

---


## ✅ 2단계. **언리얼 프로젝트 초기 세팅**


> 개발에 필요한 환경 및 레벨 구성

- [ ] Unreal Engine 5.3 이상 설치
- [ ] 새로운 프로젝트 생성 (Blueprint + Third Person or Blank)
- [ ] 플러그인 활성화
- `Learning Agents`
- `Learning Agents Training`
- `Learning Agents Inference`
- [ ] 테스트용 실내 맵 구성 (예: 방/복도/문/테이블 등)

---


## ✅ 3단계. **드론 Pawn 제작 및 이동 로직 구성**


> 비행 가능한 드론 Pawn을 만들고, 센서/액추에이터 부착

- [ ] `BP_DroneAgent` Pawn 생성
- [ ] `FloatingPawnMovement` 또는 자체 비행 컴포넌트 설정
- [ ] 입력 없이 코드나 정책으로만 이동하도록 설계
- [ ] 충돌/장애물 피하기 위한 콜라이더 설정

---


## ✅ 4단계. **Learning Agents 구성 (관찰/행동/보상)**


> 자율 학습을 위한 정책과 루프 구성

- [ ] SensorComponent: 현재 위치, 방향, 목표와의 거리 등 관찰
- [ ] ActuatorComponent: 이동 방향 벡터 또는 회전 값
- [ ] RewardComponent:
- 목표 도달 시 `+1`
- 충돌 시 `1`
- 탐색한 구역 증가 시 `+0.1`
- [ ] `LearningAgentsTrainerActor`, `Policy` 컴포넌트 연결

---


## ✅ 5단계. **탐색 로직 + 맵핑 설계**


> 드론이 어디로 갈지 결정하고, 방문 영역을 저장하는 로직

- [ ] 격자 기반 탐색 (그리드 방문 여부 저장)
- [ ] 새로운 위치로 이동하는 경로 계획
- [ ] 맵 데이터 저장: `2D bool array`, `VisitedCells`

---


## ✅ 6단계. **사람 인식 및 위치 마킹**


> 특정 대상(NPC, Actor 등)을 인식하는 로직

- [ ] 대상 Actor에 `Tag` 또는 `Trigger` 부여
- [ ] 드론이 근처에 왔을 때 인식
- [ ] 인식된 위치를 `맵 배열` 또는 `UI 위젯`에 마킹

---


## ✅ 7단계. **UI 시각화 및 디버깅 도구 구성**


> 탐색 상태나 인식 결과를 실시간으로 보여주기

- [ ] 미니맵 위젯 구성 (Canvas + 점 표시)
- [ ] 로그 창에 좌표 출력
- [ ] 디버깅용 Gizmo: 선, 점 등으로 경로 시각화

---


## ✅ 8단계. **정책 학습 / 테스트 / 반복**


> 직접 학습 시킬 수도 있고, 수동 탐색 후 모방학습도 가능

- [ ] 초기 탐색 행동을 정해놓고 imitation learning
- [ ] 이후 reward 기반으로 강화학습 훈련
- [ ] 학습된 policy를 저장해서 반복 실험

---


## ✅ 9단계. **결과 분석 및 문서화**


> 결과를 정리하고 문서화

- [ ] 각 단계의 성능 지표 저장 (성공률, 탐색률, 시간 등)
- [ ] 영상 캡처 및 스크린샷 저장
- [ ] Notion 문서에 개발 로그 기록

---


## 🔁 전체 플로우 요약


```mermaid
mermaid
복사편집
graph TD
A[목표 설정] --> B[언리얼 프로젝트 구성]
B --> C[드론 Pawn 제작]
C --> D[Learning Agents 구성]
D --> E[탐색 로직 구현]
E --> F[사람 인식]
F --> G[맵핑 및 시각화]
G --> H[학습 및 반복]
H --> I[결과 기록 및 Notion 정리]


```


---


## ✨ 다음으로 추천하는 행동

1. 지금 이 순서를 **Notion에 복사해서 체크리스트**로 정리
1. `BP_DroneAgent`부터 만들면서 드론이 이동하도록 테스트
1. UI 기반 미니맵 → 인식 좌표 마킹 → 기록으로 발전

---


필요하면 각 단계별로 코드, 블루프린트, Asset 구성까지 도와드릴 수 있어요.

