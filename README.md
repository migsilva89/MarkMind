# Bookmark AI

Uma extensão para Chrome que ajuda a organizar seus bookmarks de forma inteligente.

## Funcionalidades

- Adicionar a página atual aos bookmarks
- Visualizar e gerenciar bookmarks existentes
- Organizar bookmarks em pastas
- Interface moderna e intuitiva

## Estrutura do Projeto

```
src/
├── js/
│   ├── popup.js
│   └── background.js
├── css/
│   └── style.css
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── manifest.json
└── popup.html
```

## Instalação

1. Clone este repositório
2. Abra o Chrome e vá para `chrome://extensions/`
3. Ative o "Modo do desenvolvedor"
4. Clique em "Carregar sem compactação"
5. Selecione a pasta `src` do projeto

## Desenvolvimento

### Pré-requisitos

- Google Chrome
- Conhecimento básico de JavaScript, HTML e CSS

### Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/bookmark-ai.git
cd bookmark-ai
```

2. Abra o projeto em seu editor favorito

3. Para testar as alterações:
   - Vá para `chrome://extensions/`
   - Clique no ícone de recarregar na extensão
   - As alterações serão aplicadas imediatamente

## Roadmap

- [x] Estrutura básica da extensão
- [x] Interface do usuário
- [x] Gerenciamento de bookmarks
- [ ] Categorização automática usando IA
- [ ] Sugestões inteligentes de organização
- [ ] Sincronização entre dispositivos

## Contribuição

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes. 