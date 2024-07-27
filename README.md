<div align="center">
  <h1>gepeto-speaker-recorgnizer</h1>
</div>

Script que reconhece o locutor de um áudio

## Como funciona

Para reconhecer é preciso treinar o sistema com amostras de áudio. Segue a lista de requisitos para a amostra:

- Precisa ser no formato `.wav`, com um sample rate de `16000 Hz` e canal `mono` (É possível usar o `Audacity` ou o `ffmpeg` para ajustar);
- Ter no mínimo 30 segundos, para uma acurácia mais eficiente.

## Serviços Utilizados

- [PicoVoice (Eagle Speaker Recognition)](https://picovoice.ai/docs/quick-start/eagle-nodejs/)
