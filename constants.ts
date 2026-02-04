
import { DiagramTemplate } from './types';

export const DEFAULT_MERMAID_CODE = `graph LR
    A[사용자] --> B{로그인}
    B -- 성공 --> C[대시보드]
    B -- 실패 --> D[재시도]

sequenceDiagram
    participant U as User
    participant S as Server
    U->>S: Request Data
    S-->>U: JSON Response

mindmap
  root((개발 계획))
    프론트엔드
      React
      Mermaid
    백엔드
      Node.js
      Gemini API`;

export const TEMPLATES: DiagramTemplate[] = [
  {
    id: 'multiview',
    name: 'Multi-View (복합)',
    icon: '🍱',
    code: `graph LR
    A[사용자] --> B{로그인}
    B -- 성공 --> C[대시보드]
    B -- 실패 --> D[재시도]

sequenceDiagram
    participant U as User
    participant S as Server
    U->>S: Request Data
    S-->>U: JSON Response

mindmap
  root((개발 계획))
    프론트엔드
      React
      Mermaid
    백엔드
      Node.js
      Gemini API`
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    icon: '📊',
    code: `graph TD
    Start --> Stop`
  },
  {
    id: 'sequence',
    name: 'Sequence',
    icon: '🔄',
    code: `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: Jolly good!`
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    icon: '📅',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d`
  },
  {
    id: 'class',
    name: 'Class Diagram',
    icon: '🏗️',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()`
  },
  {
    id: 'state',
    name: 'State Diagram',
    icon: '⚙️',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    id: 'er',
    name: 'ER Diagram',
    icon: '🔗',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    icon: '🧠',
    code: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan`
  }
];
