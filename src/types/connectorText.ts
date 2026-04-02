export interface ConnectorTextBlock {
  type: 'connector_text'
  text: string
}

export function isConnectorTextBlock(block: unknown): block is ConnectorTextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    (block as Record<string, unknown>).type === 'connector_text'
  )
}
