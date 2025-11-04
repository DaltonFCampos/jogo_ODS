# Jogo ODS 14 - Vida na Água

Jogo educativo desenvolvido com **Phaser 3** que aborda o **ODS 14 (Objetivos de Desenvolvimento Sustentável - Vida na Água)**. O jogador controla um navio que protege a vida marinha, coletando poluição e derrotando inimigos.

## 🎮 Sobre o Jogo

Shooter 2D onde você:
- **Controla um navio** que protege uma tartaruga marinha
- **Coleta poluição** que cai no oceano
- **Derrota inimigos** que ameaçam a vida marinha
- **Evita que a poluição** chegue a 100%

## 🚀 Como Executar

1. Clone ou baixe o repositório
2. Abra o arquivo `jogo/index.html` em um navegador moderno
3. Ou use um servidor local:
   ```bash
   # Com Python
   python -m http.server 8000
   
   # Com Node.js (http-server)
   npx http-server
   ```
4. Acesse `http://localhost:8000/jogo/` no navegador

## 🎯 Controles

- **WASD**: Mover o navio
- **SPACE**: Atirar
- **P / ESC**: Pausar o jogo
- **ENTER / ESPAÇO**: Menu (tela de game over)

## 📁 Estrutura do Projeto

```
jogo_ODS/
├── artefatos/              # Documentação do projeto
│   ├── Documento_Requisitos.pdf
│   ├── Plano_de_Teste.pdf
│   └── ...
├── jogo/                   # Código do jogo
│   ├── index.html          # Página principal
│   ├── phaser.js           # Biblioteca Phaser 3
│   ├── assets/             # Recursos do jogo
│   │   ├── audio/          # Sons e músicas
│   │   └── *.png           # Sprites
│   └── src/                # Código fonte
│       ├── main.js         # Configuração inicial
│       └── scenes/         # Cenas do jogo
│           ├── MenuScene.js
│           ├── MainScene.js
│           └── GameOverScene.js
```

## ✨ Funcionalidades

- ✅ Sistema de pontuação
- ✅ Sistema de HP (vida) para jogador e tartaruga
- ✅ Sistema de poluição (evite chegar a 100%)
- ✅ Coleta de itens (corações para recuperar HP)
- ✅ Múltiplas cenas (Menu, Jogo, Game Over)
- ✅ Sistema de pause
- ✅ Configurações de volume
- ✅ Instruções integradas
- ✅ Áudio e efeitos sonoros

## 🛠️ Tecnologias

- **Phaser 3.88.2** - Framework de jogos 2D
- **JavaScript (ES6+)** - Linguagem de programação
- **HTML5** - Estrutura
- **CSS3** - Estilização básica

## 📚 Documentação

A documentação completa do projeto está disponível na pasta `artefatos/`:
- Documento de Requisitos
- Plano de Teste
- Diagramas de Classes e Casos de Uso
- Especificação Formal em Redes de Petri

## 🎯 Objetivo do Jogo

Proteja a tartaruga marinha e mantenha o oceano limpo coletando poluição antes que ela chegue a 100%. Derrote inimigos e colete corações para manter sua vida.

---

**Desenvolvido para promover conscientização sobre o ODS 14 - Vida na Água**

