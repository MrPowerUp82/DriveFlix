# Catálogo de Filmes e Séries

Um site estático de catálogo de filmes e séries para GitHub Pages, permitindo assistir vídeos armazenados no Google Drive.

## Como Usar

1. Abra `admin.html` no navegador
2. Faça login com a senha configurada
3. Adicione ou edite filmes e séries
4. Clique em "Exportar catalog.json"
5. Substitua `data/catalog.json` no repositório com o arquivo baixado
6. Faça commit e push das mudanças
7. O site será atualizado automaticamente pelo GitHub Pages

## Precondições Importantes

Para o site funcionar corretamente:

1. **Imagens de Pôster**: Os URLs de imagem devem ser públicos e acessíveis diretamente. Use links de imagens públicas na web.

2. **Vídeos do Google Drive**: Os arquivos de vídeo compartilhados devem estar configurados como "Qualquer pessoa com o link" pode acessar. Sem essa permissão, o player integrado não conseguirá carregar o vídeo.

## Estrutura

- `index.html` - Página inicial com grid de catálogo
- `titulo.html` - Página de detalhes (filme ou série)
- `admin.html` - Painel de administração (protegido por senha)
- `assets/` - CSS, JavaScript compartilhado, e lógica de admin
- `data/catalog.json` - Arquivo de dados do catálogo
