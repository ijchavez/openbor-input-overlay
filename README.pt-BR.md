# OpenBOR Input Overlay

[Español](README.md) | [English](README.en.md) | **Português (Brasil)**

Overlay transparente para Windows que transforma as teclas usadas no OpenBOR em um controle visual. Foi desenvolvido para jogar, gravar ou transmitir com o OBS e oferece entrada global, click-through, movimentação e redimensionamento, skins, remapeamento de teclas, perfis, modo de transmissão e controle pela bandeja do Windows.

## Índice

- [Recursos](#recursos)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Início rápido](#início-rápido)
- [Interface do overlay](#interface-do-overlay)
- [Iluminação configurável](#iluminação-configurável)
- [Entrada global e fallback local](#entrada-global-e-fallback-local)
- [Mover e redimensionar](#mover-e-redimensionar)
- [Trocar os controles de lado](#trocar-os-controles-de-lado)
- [Click-through](#click-through)
- [Modo de transmissão para o OBS](#modo-de-transmissão-para-o-obs)
- [Skins](#skins)
- [Configurar as teclas](#configurar-as-teclas)
- [Joystick ou gamepad USB](#joystick-ou-gamepad-usb)
- [Perfis](#perfis)
- [Bandeja do Windows](#bandeja-do-windows)
- [Atalhos de teclado](#atalhos-de-teclado)
- [Persistência e arquivos de configuração](#persistência-e-arquivos-de-configuração)
- [Referência do `config.json`](#referência-do-configjson)
- [Usar com o OpenBOR](#usar-com-o-openbor)
- [Configurar o OBS](#configurar-o-obs)
- [Compilar o instalador e o executável portátil](#compilar-o-instalador-e-o-executável-portátil)
- [Solução de problemas](#solução-de-problemas)
- [Limitações atuais](#limitações-atuais)
- [Arquitetura do projeto](#arquitetura-do-projeto)
- [Segurança do renderer](#segurança-do-renderer)
- [Desenvolvimento e Git](#desenvolvimento-e-git)

## Recursos

- Overlay transparente e sempre visível sobre outras janelas.
- Entrada global do teclado por meio do `uiohook-napi`, com fallback local.
- Indicadores visuais para direções, botões de ação, Start e Select.
- Direção por stick analógico visual ou D-pad, incluindo diagonais.
- Skins PlayStation, Xbox e arcade.
- Click-through para o mouse atravessar o overlay.
- Modo de movimentação com restauração automática do click-through.
- Tamanho ajustável entre `380 × 165` e `760 × 330` pixels.
- Remapeamento visual de teclas sem editar JSON manualmente.
- Layout reversível para colocar o D-pad/stick à esquerda ou à direita.
- Suporte direto a gamepads USB com mapeamento padrão.
- Perfis individuais em arquivos JSON com mapeamento, skin, tamanho e layout.
- Modo de transmissão limpo para o OBS.
- Persistência automática de posição, tamanho, skin, click-through, modo de transmissão e último perfil.
- Menu na bandeja do Windows e atalhos globais.
- Configuração local separada dos valores padrão do repositório.
- Cópia de segurança antes de sobrescrever o estado local.

## Requisitos

- Windows 10 ou 11, preferencialmente x64.
- Node.js 20 ou superior para executar a partir do código-fonte.
- npm, incluído com o Node.js.
- OpenBOR em modo janela ou sem bordas para sobrepor o overlay ao jogo.
- OBS Studio para gravar ou transmitir.

## Instalação

### Instalar as dependências

Abra o PowerShell na pasta do projeto:

```powershell
cd D:\OneDrive\Documents\openbor-input-overlay
npm.cmd install
```

Também é possível usar `npm install` se o PowerShell permitir a execução do `npm.ps1`.

### Executar o aplicativo

```powershell
npm.cmd start
```

Ao iniciar, o overlay é aberto e um ícone aparece na bandeja do Windows, ao lado do relógio. Se ele não estiver visível, procure no menu de ícones ocultos, acessado pela seta `^`.

### Outros comandos

```powershell
npm.cmd run dev
npm.cmd run build:portable
npm.cmd run build:installer
npm.cmd run build
```

- `npm.cmd run dev`: inicia o Electron com o argumento de desenvolvimento.
- `npm.cmd run build:portable`: gera somente o executável portátil x64.
- `npm.cmd run build:installer`: gera somente o instalador NSIS x64.
- `npm.cmd run build`: gera os dois artefatos em `dist/`.

## Início rápido

1. Inicie o overlay com `npm.cmd start`.
2. Confirme que o indicador exibe `Input global activo` (entrada global ativa).
3. Pressione `Ctrl+Shift+M` para entrar no modo de movimentação.
4. Arraste a faixa superior, ajuste o tamanho com `−` ou `+` e use `⇄` para trocar os controles de lado.
5. Pressione `Ctrl+Shift+M` novamente para concluir.
6. Use `Configurar teclas` se o mapeamento padrão não coincidir com o OpenBOR.
7. Ative o click-through com `Ctrl+Shift+I` para o overlay não interceptar o mouse.
8. Para transmitir, ative `Modo OBS` ou pressione `Ctrl+Shift+S`.
9. Para sair do modo OBS, pressione `Ctrl+Shift+S` novamente ou use a bandeja.

> Atualmente, a interface do aplicativo é exibida em espanhol; este guia mantém os rótulos originais quando eles ajudam a identificar um controle.

## Interface do overlay

- **Barra superior:** nome do aplicativo, área para arrastar e indicador de entrada.
- **Controle de direção:** stick visual ou D-pad, conforme `directionControl`.
- **Botões centrais:** Select e Start.
- **Botões de ação:** triângulo, círculo, cruz e quadrado; as skins Xbox e arcade usam outros símbolos.
- **Barra inferior:** movimentação, tamanho, modo OBS, perfis, iluminação, configuração de teclas e click-through.

O indicador fica verde quando a entrada global está ativa e amarelo quando o fallback local está ativo.

## Iluminação configurável

Clique em `Iluminación` na barra inferior ou escolha `Configurar iluminación` na bandeja. O painel controla separadamente a cor e a intensidade dos botões de ação/sistema e do D-pad/stick. Também controla uma trilha direcional: as posições anteriores do stick permanecem visíveis por alguns instantes, enquanto as direções liberadas no D-pad recebem um brilho que desaparece. As mudanças são visualizadas ao vivo, aceitam qualquer cor oferecida pelo seletor, persistem após reiniciar e não são sobrescritas ao mudar de skin ou perfil.

## Entrada global e fallback local

A entrada global usa o [`uiohook-napi`](https://www.npmjs.com/package/uiohook-napi), um binding nativo que escuta eventos `keydown` e `keyup` mesmo quando o OpenBOR está em foco.

O aplicativo converte cada `KeyboardEvent.code` configurado no `UiohookKey` correspondente, escuta a tecla globalmente, envia o evento do processo principal ao renderer e atualiza o controle visual. Repetições automáticas do sistema são filtradas para evitar eventos duplicados.

Se o módulo nativo não puder ser carregado, o aplicativo continua em modo `Fallback local`. Nesse modo, o overlay precisa estar em foco, não recebe as teclas enquanto o OpenBOR está em foco e serve principalmente para testar o mapeamento e diagnosticar o hook global.

## Mover e redimensionar

Pressione `Ctrl+Shift+M` ou escolha `Modo mover` na bandeja. Enquanto esse modo estiver ativo:

- O click-through é desativado temporariamente e o aplicativo recebe o foco.
- A faixa superior pode ser arrastada para mudar a posição.
- Os controles `− TAMAÑO +` aparecem na barra inferior.
- `−` e `Ctrl+Shift+↓` reduzem o tamanho em aproximadamente 10%.
- `+` e `Ctrl+Shift+↑` aumentam o tamanho em aproximadamente 10%.

O tamanho máximo é `760 × 330` e o mínimo é `380 × 165`. O conteúdo é redimensionado proporcionalmente e a janela mantém o centro. A posição e o tamanho são salvos automaticamente. Ao sair, o estado anterior do click-through é restaurado.

## Trocar os controles de lado

Com o modo de movimentação ativo, pressione `⇄` para alternar entre:

- **Padrão:** D-pad/stick à esquerda e botões de ação à direita.
- **Invertido:** botões de ação à esquerda e D-pad/stick à direita.

Também é possível alternar `Controles invertidos` na bandeja. O layout é salvo automaticamente e faz parte de cada perfil.

## Click-through

O click-through faz com que a entrada do mouse atravesse o overlay e chegue ao jogo ou à janela abaixo dele. Alterne o estado pelo botão da barra inferior, por `Ctrl+Shift+I` ou pelo menu da bandeja.

Os botões de click-through, configuração, perfis e OBS mantêm pequenas áreas interativas quando o cursor passa sobre eles. Os modos de movimentação, configuração e perfis desativam o click-through temporariamente e restauram o valor anterior ao fechar. Se o modo OBS ocultar os controles, use o atalho ou a bandeja.

## Modo de transmissão para o OBS

O modo de transmissão limpo oculta a barra superior, o indicador de entrada, a barra inferior, os botões de configuração e as ajudas visíveis. O controle continua respondendo normalmente.

Alterne o modo com `Ctrl+Shift+S`, com o botão `Modo OBS` ou com `Modo transmisión limpio` na bandeja. Se os botões desaparecerem depois da ativação, isso é esperado: pressione o atalho novamente ou use a bandeja. Entrar no modo de movimentação restaura temporariamente os controles necessários. O estado do modo OBS é preservado entre reinicializações.

## Skins

As skins disponíveis são `playstation`, `xbox` e `arcade`. Troque a skin com `Ctrl+Shift+K`, com `Cambiar skin` na bandeja, pela propriedade `skin` da configuração ou carregando um perfil. A skin altera símbolos, cores e apresentação, mas não modifica o mapeamento de teclas.

## Configurar as teclas

1. Clique em `Configurar teclas` na barra inferior ou na bandeja.
2. Selecione Cima, Baixo, Esquerda, Direita, Superior, Direito, Inferior, Esquerdo, Select ou Start.
3. Pressione a nova tecla.
4. A alteração é salva e o hook global reinicia com o novo mapeamento.
5. Repita quando necessário e clique em `Terminar configuración`.

Cada controle aceita uma tecla principal. Se uma tecla já utilizada for atribuída a outro controle, ela será movida para o novo controle, evitando conflitos. Ao remapear um controle, sua atribuição anterior é removida.

### Mapeamento padrão

| Tecla | Controle visual |
|---|---|
| `ArrowUp` | Cima |
| `ArrowDown` | Baixo |
| `ArrowLeft` | Esquerda |
| `ArrowRight` | Direita |
| `Z` | Quadrado / botão esquerdo |
| `X` | Cruz / botão inferior |
| `C` | Círculo / botão direito |
| `V` | Triângulo / botão superior |
| `Enter` | Start |
| `ShiftLeft` ou `ShiftRight` | Select |

### Códigos de teclado

O mapeamento usa valores de [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code), como `KeyA`, `Digit1`, `ArrowUp`, `Enter`, `Space`, `ShiftLeft`, `Numpad0` e `F1` a `F24`. Nem toda tecla especial possui um equivalente em `UiohookKey`. O fallback local pode reconhecer códigos não aceitos pelo hook global.

## Joystick ou gamepad USB

O aplicativo usa a Gamepad API para detectar o primeiro controle USB exposto pelo Windows e pelo Chromium. Isso não depende do hook global do teclado.

| Controle físico | Controle visual |
|---|---|
| Stick esquerdo ou D-pad | Direções |
| A / cruz (botão 0) | Cruz / botão inferior |
| B / círculo (botão 1) | Círculo / botão direito |
| X / quadrado (botão 2) | Quadrado / botão esquerdo |
| Y / triângulo (botão 3) | Triângulo / botão superior |
| Back / Share (botão 8) | Select |
| Start / Options (botão 9) | Start |

Conecte o controle antes ou depois de abrir o overlay e pressione um botão se o navegador ainda não o tiver enumerado. O status muda para `Gamepad USB: nome do dispositivo`; as entradas aparecem no overlay e na captura do OBS. Teclado e gamepad funcionam simultaneamente. O stick esquerdo usa uma zona morta de `0.45`. O mapeamento USB é fixo atualmente, portanto controles genéricos não padronizados podem apresentar botões trocados.

## Perfis

Os perfis agrupam configurações para jogos ou jogadores diferentes e são salvos como arquivos `.json` separados.

### Escolher a pasta de perfis

Abra `Perfiles`, clique em `Elegir carpeta`, escolha ou crie uma pasta e clique em `Usar esta carpeta`. O caminho é preservado ao reiniciar e os arquivos `.json` válidos preenchem a lista. Arquivos inválidos são ignorados.

Os locais padrão são `profiles/` dentro do repositório durante o desenvolvimento, ao lado do executável na versão portátil e dentro dos dados do aplicativo na versão instalada. Perfis antigos incorporados à configuração são migrados para arquivos individuais na primeira inicialização.

### Criar, carregar ou excluir um perfil

Para criar ou atualizar, configure o mapeamento, a skin, o tamanho e o layout; abra `Perfiles`; informe um nome de até 40 caracteres; e clique em `Crear / actualizar perfil`. Um perfil com o mesmo nome será substituído.

Para carregar, selecione o nome em `Perfiles guardados` e clique em `Cargar`, ou use o submenu da bandeja. Mapeamento, skin, tamanho e layout são aplicados imediatamente, e o hook global é reiniciado.

Para excluir, selecione o perfil, clique em `Eliminar` e confirme. Excluir o perfil ativo remove sua marca, mas mantém na memória o mapeamento já aplicado.

Cada perfil salva o mapeamento do teclado, a skin, a largura e a altura do overlay e o layout padrão ou invertido. Atualmente não salva a posição na tela, click-through, opacidade, modo OBS ou `directionControl`; esses valores podem persistir como estado geral do aplicativo.

## Bandeja do Windows

O ícone aparece ao lado do relógio e pode estar dentro da área de ícones ocultos `^`. Um clique esquerdo mostra ou oculta o overlay; um clique direito abre o menu completo.

O menu controla a visibilidade, o modo de movimentação, o modo de transmissão limpo, o click-through, o carregamento e gerenciamento de perfis, a configuração de teclas, a skin, a inversão dos controles e a saída do aplicativo. `Alt+F4` apenas oculta a janela na bandeja. Escolha `Salir` para encerrar o processo.

## Atalhos de teclado

| Atalho | Ação |
|---|---|
| `Ctrl+Shift+O` | Mostrar ou ocultar o overlay |
| `Ctrl+Shift+K` | Selecionar a próxima skin |
| `Ctrl+Shift+I` | Ativar ou desativar o click-through |
| `Ctrl+Shift+M` | Entrar ou sair do modo de movimentação |
| `Ctrl+Shift+S` | Entrar ou sair do modo de transmissão limpo |
| `Ctrl+Shift+↓` | Reduzir enquanto o modo de movimentação está ativo |
| `Ctrl+Shift+↑` | Aumentar enquanto o modo de movimentação está ativo |

Os cinco primeiros atalhos são configurados em `hotkeys`; os atalhos de tamanho são fixos atualmente. Se um atalho não responder, outro aplicativo ou outra instância do overlay pode tê-lo registrado.

## Persistência e arquivos de configuração

O `config.json` contém valores padrão limpos e versionados. Durante o desenvolvimento, `npm.cmd start` salva o estado pessoal no `config.user.json`, ignorado pelo Git.

Em aplicativos empacotados:

1. A versão portátil detecta `PORTABLE_EXECUTABLE_DIR` e salva `config.json` e `profiles/` ao lado do `.exe`.
2. Uma instalação normal usa um `config.json` ao lado do executável, caso ele exista.
3. Caso contrário, usa o diretório `userData` do Electron, normalmente `%APPDATA%\openbor-input-overlay\config.json`.

Antes de sobrescrever a configuração, o aplicativo cria `config.user.json.bak` ou o `.bak` correspondente. Primeiro grava um arquivo `.tmp` e depois substitui o destino, reduzindo o risco de JSON incompleto. O estado é salvo depois de mover, redimensionar, trocar a skin, alternar click-through ou modo OBS, mudar o layout, escolher a pasta de perfis, criar/carregar/excluir perfis e sair.

## Referência do `config.json`

```json
{
  "skin": "playstation",
  "directionControl": "stick",
  "layout": "standard",
  "scale": 1,
  "opacity": 0.96,
  "lighting": {
    "buttonColor": "#59e4ff",
    "buttonIntensity": 1,
    "dpadColor": "#59e4ff",
    "dpadIntensity": 0.65,
    "trailEnabled": true,
    "trailDuration": 240,
    "trailIntensity": 0.55
  },
  "showLabels": true,
  "showShoulders": true,
  "alwaysOnTop": true,
  "clickThrough": false,
  "streamMode": false,
  "window": { "width": 760, "height": 330, "x": null, "y": null },
  "hotkeys": {
    "toggleVisibility": "CommandOrControl+Shift+O",
    "cycleSkin": "CommandOrControl+Shift+K",
    "toggleClickThrough": "CommandOrControl+Shift+I",
    "toggleMoveMode": "CommandOrControl+Shift+M",
    "toggleStreamMode": "CommandOrControl+Shift+S"
  },
  "mapping": { "ArrowUp": "up", "KeyZ": "square" },
  "profilesDirectory": null,
  "activeProfile": null
}
```

| Propriedade | Tipo | Descrição |
|---|---|---|
| `skin` | string | `playstation`, `xbox` ou `arcade` |
| `directionControl` | string | `stick` ou `dpad` |
| `layout` | string | `standard` ou `reversed` |
| `scale` | number | Escala adicional do conteúdo visual |
| `opacity` | number | Opacidade, normalmente de `0` a `1` |
| `lighting.buttonColor` | string | Cor hexadecimal do brilho dos botões |
| `lighting.buttonIntensity` | number | Intensidade dos botões de `0` a `1` |
| `lighting.dpadColor` | string | Cor hexadecimal do brilho do D-pad ou stick |
| `lighting.dpadIntensity` | number | Intensidade do D-pad ou stick de `0` a `1` |
| `lighting.trailEnabled` | boolean | Ativa a trilha do stick e o brilho residual do D-pad |
| `lighting.trailDuration` | number | Duração do efeito em milissegundos, de `80` a `600` |
| `lighting.trailIntensity` | number | Opacidade inicial da trilha de `0` a `1` |
| `showLabels` | boolean | Mostra ou oculta rótulos e a barra inferior |
| `showShoulders` | boolean | Mostra ou oculta os gatilhos L/R superiores |
| `alwaysOnTop` | boolean | Mantém a janela sobre as demais |
| `clickThrough` | boolean | Estado inicial e persistente do click-through |
| `streamMode` | boolean | Estado persistente do modo de transmissão limpo |
| `window.width` | number | Largura limitada entre `380` e `760` |
| `window.height` | number | Altura proporcional à largura |
| `window.x`, `window.y` | number ou null | Posição; `null` deixa o Windows decidir |
| `hotkeys` | object | Aceleradores globais compatíveis com o Electron |
| `mapping` | object | Relação `KeyboardEvent.code` → controle visual |
| `profilesDirectory` | string ou null | Pasta de perfis; `null` usa o local padrão |
| `profiles` | object | Campo legado migrado para arquivos individuais |
| `activeProfile` | string ou null | Último perfil carregado ou criado |

Os controles válidos são `up`, `down`, `left`, `right`, `square`, `cross`, `circle`, `triangle`, `start` e `select`. Edite o arquivo local somente com o aplicativo fechado. Um JSON inválido faz o aplicativo usar os valores padrão e registrar um aviso no console.

## Usar com o OpenBOR

1. Inicie o overlay e depois o OpenBOR.
2. Execute o OpenBOR em modo janela ou sem bordas.
3. Execute os dois programas com o mesmo nível de privilégio.
4. Ajuste o mapeamento para coincidir com as teclas configuradas no OpenBOR.
5. Posicione e dimensione o overlay.
6. Ative o click-through antes de jogar.

A tela cheia exclusiva pode ser desenhada acima de qualquer overlay. Se o OpenBOR for executado como administrador e o overlay não, o Windows pode impedir a captura das teclas; execute ambos normalmente ou no mesmo nível de privilégio.

## Configurar o OBS

1. Inicie o overlay e o OpenBOR.
2. Adicione uma fonte `Captura de janela` no OBS.
3. Selecione `OpenBOR Input Overlay`.
4. Use Windows Graphics Capture quando disponível e preserve a transparência.
5. Ative o modo OBS com `Ctrl+Shift+S`.
6. Posicione a fonte na cena.

Como alternativa, capture a área de trabalho ou o jogo com o overlay já posicionado sobre ele. Não deve ser necessário usar chroma key. Se aparecer um retângulo preto, altere o método de captura e verifique se o canal alfa é preservado.

## Compilar o instalador e o executável portátil

```powershell
# Somente o portátil
npm.cmd run build:portable

# Somente o instalador NSIS
npm.cmd run build:installer

# Ambos
npm.cmd run build
```

Os artefatos são gravados em `dist/`, com nomes semelhantes a `OpenBOR Input Overlay-Portable-1.0.0-x64.exe` e `OpenBOR Input Overlay-Setup-1.0.0-x64.exe`.

A compilação usa o App ID `com.openbor.inputoverlay`, Windows x64 e os targets `portable` e `nsis`. O `uiohook-napi` fica fora do ASAR para que o binário nativo possa ser carregado, e `npmRebuild` está desativado atualmente. Teste os dois artefatos em uma máquina limpa antes de distribuir. Como não possuem assinatura digital, o Windows SmartScreen pode exibir um aviso ao baixar ou executar.

## Solução de problemas

### `npm` não é reconhecido

Instale o Node.js e reabra o PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
node --version
npm.cmd --version
```

### O PowerShell bloqueia o `npm.ps1`

Use `npm.cmd install` e `npm.cmd start`, ou permita scripts locais:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Não consigo sair do modo OBS

Pressione `Ctrl+Shift+S` ou clique com o botão direito no ícone da bandeja e desmarque `Modo transmisión limpio`.

### Não consigo clicar, mover ou redimensionar o overlay

Desative o click-through com `Ctrl+Shift+I`. Para mover, pressione `Ctrl+Shift+M`, arraste a faixa superior, redimensione com `−`, `+` ou os atalhos de seta e pressione `Ctrl+Shift+M` novamente.

### O aplicativo desapareceu ao fechar

Ele foi ocultado na bandeja. Clique no ícone para restaurar ou escolha `Salir` para encerrar.

### O ícone da bandeja não aparece

Verifique a área de ícones ocultos `^` e o Gerenciador de Tarefas. Você pode arrastar o ícone para a área visível.

### O indicador mostra fallback local

Use Windows x64 e Node.js LTS, feche o aplicativo, execute `npm.cmd install`, mantenha o OpenBOR e o overlay no mesmo nível de privilégio e verifique se o antivírus colocou em quarentena algum arquivo `.node` do `uiohook-napi`.

### Uma tecla funciona localmente, mas não globalmente

Talvez ela não tenha equivalente em `UiohookKey`. Verifique `nativeName()` e `CODE_ALIASES` em `src/input-manager.js` ou use outra tecla compatível.

### O overlay não aparece sobre o OpenBOR

Evite tela cheia exclusiva, use modo janela ou sem bordas, confirme `alwaysOnTop: true` e verifique se o overlay não está oculto por `Ctrl+Shift+O` ou pela bandeja.

### O OBS mostra um retângulo preto

Use Windows Graphics Capture, verifique a transparência alfa ou tente a captura da área de trabalho. Evite chroma key, exceto quando o método não preservar alfa.

### Uma cópia antiga foi aberta

Execute `npm.cmd start` no repositório correto e feche processos iniciados a partir de outras cópias.

### A configuração foi corrompida

Saia pela bandeja, revise `config.user.json` e `config.user.json.bak`, restaure o backup ou remova o arquivo local para voltar aos padrões e não exclua o `config.json` do repositório.

## Limitações atuais

- O Windows é a única plataforma principal testada.
- Gamepads usam um mapeamento padrão fixo; seus botões e os botões do mouse ainda não podem ser remapeados.
- Há suporte a um overlay e um jogador por instância.
- Os perfis não salvam posição, opacidade, click-through ou tipo de controle direcional.
- Ainda não há janela de configuração separada, importação/exportação dedicada de perfis ou atualização automática.
- Os atalhos de tamanho não são configuráveis no `config.json`.
- A tela cheia exclusiva pode impedir a exibição do overlay.

## Arquitetura do projeto

```text
openbor-input-overlay/
├─ main.js                 Processo principal, janela, bandeja, atalhos e IPC
├─ preload.js              API segura exposta ao renderer
├─ config.json             Valores padrão versionados
├─ config.user.json        Estado local ignorado pelo Git
├─ src/
│  ├─ config.js            Carregamento, mesclagem, persistência e backup
│  ├─ profile-store.js      Perfis JSON e migração
│  └─ input-manager.js     Hook global e atualização do mapeamento
└─ renderer/
   ├─ index.html           Estrutura visual e painéis
   ├─ styles.css           Skins, escala e modos visuais
   └─ app.js               Estado visual, mapeamento, gamepad e perfis
```

O `main.js` gerencia a `BrowserWindow`, a bandeja, os atalhos, a persistência, os perfis e os modos. O `preload.js` expõe somente as operações IPC necessárias por meio do `contextBridge`. Os módulos em `src` gerenciam a configuração, a entrada nativa e os arquivos de perfil. O `renderer/app.js` atualiza os controles, o stick visual, o gamepad USB, o layout e os painéis.

## Segurança do renderer

A janela usa `contextIsolation: true`, `nodeIntegration: false` e um preload limitado por `contextBridge`. O renderer não acessa diretamente o sistema de arquivos nem os módulos do Node.js; operações sensíveis são realizadas pelo processo principal através de canais IPC definidos explicitamente.

## Desenvolvimento e Git

O estado pessoal não deve ser incluído em commits:

```text
config.user.json
config.user.json.bak
config.user.json.tmp
```

Antes de fazer um commit:

```powershell
git status --short
git diff --check
node --check main.js
node --check preload.js
node --check renderer/app.js
node --check src/config.js
node --check src/input-manager.js
```

Use `npm.cmd start` para testar e `npm.cmd run build` para gerar os artefatos. Mantenha o `config.json` com valores padrão limpos e teste alterações pessoais pelo `config.user.json`.
