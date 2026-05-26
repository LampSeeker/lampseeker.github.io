---
title: "Yolo 기반 쓰레기 탐지 APP"
date: "2024-06-21T00:44:00.000Z"
lastmod: "2026-05-17T07:33:00.000Z"
draft: false
태그: []
authors:
  - "조현근"
NOTION_METADATA:
  object: "page"
  id: "3e15db21-fa5a-4a44-ba69-f13a54349dfd"
  created_time: "2024-06-21T00:44:00.000Z"
  last_edited_time: "2026-05-17T07:33:00.000Z"
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
      created_time: "2024-06-21T00:44:00.000Z"
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
            content: "Yolo 기반 쓰레기 탐지 APP"
            link: null
          annotations:
            bold: false
            italic: false
            strikethrough: false
            underline: false
            code: false
            color: "default"
          plain_text: "Yolo 기반 쓰레기 탐지 APP"
          href: null
  url: "https://www.notion.so/Yolo-APP-3e15db21fa5a4a44ba69f13a54349dfd"
  public_url: null
  archived: false
MANAGED_BY_NOTION_HUGO: true

---


# Team BIO : 재활용품 분리배출 도우미


![](https://lampseeker.github.io/api?block_id=5524a46b-b915-4790-96af-7b4507f37ba5)


## 프로젝트 소개


모바일 환경에서 YOLOv8기반 Object Detection으로 재활용 쓰레기를 탐지하여 사용자들에게 올바른 재활용 가이드 라인을 제공한다.


사용한 Dataset - [AI-HUB 생활폐기물 데이터](https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71385)


[https://noticon-static.tammolo.com/dgggcrkxq/image/upload/v1709963083/noticon/v7lunl6p1dta5mrkuugl.png](https://noticon-static.tammolo.com/dgggcrkxq/image/upload/v1709963083/noticon/v7lunl6p1dta5mrkuugl.png)


![](https://lampseeker.github.io/api?block_id=e313843d-e9c8-4f43-ba0c-15169eb536ad)


## 구현 기능


### 기능 1 : 재활용품 탐지 - 모바일 서비스


사용자는 모바일 어플을 통해 재활용 쓰레기의 정확한 품목을 알 수 있다.


### 기능 2 : 재활용 가이드 제공 - 모바일 서비스


사용자에게 탐지된 재활용품의 처리 가이드 라인을 제공한다.


### 기능 3 : 데이터 시각화 - 개발자 도구


모델의 파이프라인을 수정하여 탐지한 물체의 이미지 벡터를 추출할 수 있다.


추출한 이미지 벡터로 T-SNE 및 PCA 시각화를 진행 후, 내부적으로 정성 평가를 위해 각 이미지를 비교할 수 있도록 도구를 개발하였다.


![](https://lampseeker.github.io/api?block_id=1985d827-8e55-48b9-ad3a-b550fc46d5ac)


![](https://lampseeker.github.io/api?block_id=af8ab335-f2ff-48b8-8a1b-34a701039bc0)


## 개발 과정 간략도


![](https://lampseeker.github.io/api?block_id=7257bbac-99cd-4a65-8c05-0b4e781eebc1)


## 디렉토리 설명


Garbage-Classification<br>
┣ [Mobile_Develop](https://github.com/mindang/Garbage-Classification/tree/main/Mobile_Develop)                # 어플리케이션 개발 폴더<br>
┃ ┗ [app](https://github.com/mindang/Garbage-Classification/tree/main/Mobile_Develop/app)                               #  어플리케이션 코드<br>
┣ [Model_Develop](https://github.com/mindang/Garbage-Classification/tree/main/Model_Develop)                 # 모델 및 데이터셋 관련 폴더<br>
┃ ┣ [Custom_Model](https://github.com/mindang/Garbage-Classification/tree/main/Model_Develop/Custom_Model)             # 기존 YOLO 패키지 수정 <br>
┃ ┣ [Dataset_Sampling](https://github.com/mindang/Garbage-Classification/tree/main/Model_Develop/Dataset_Sampling)        # 데이터셋 샘플링 관련 코드<br>
┃ ┣ [Dataset_Visualization](https://github.com/mindang/Garbage-Classification/tree/main/Model_Develop/Dataset_Visualization)   # 데이터셋 시각화 관련 코드<br>
┃ ┗ [Model_Train](https://github.com/mindang/Garbage-Classification/tree/main/Model_Develop/Model_Train)                  # 모델 가중치 및 결과<br><br><br><br>


## 현재 및 향후 기대 효과


![](https://lampseeker.github.io/api?block_id=971e397f-b209-4918-8bc0-2d05ea0ef0f4)


![](https://lampseeker.github.io/api?block_id=9d4bde82-d3d4-41f9-98f3-e173bd410824)


**[배경]** 대한민국 가정에서 버린 쓰레기는 모두 각 지역구 선별장으로 이동하게 되며 일부 자동화 선별장을 제외한 대부분은 사람이 직접 수작업 분류를 진행하고 있다.
<br>


**<첫째>**


현재는 사용자가 직접 쓰레기를 비추며 안내문을 출력하지만 IOT서비스와 연결하여 SMART쓰레기통 , SMART주방 , SMART분리수거장으로 활용할 수 있다.

