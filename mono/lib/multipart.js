/**
 * Minimaler multipart/form-data-Parser.
 *
 * Ein Upload-Formular braucht ihn, und eine Abhängigkeit dafür hereinzuholen
 * wäre teurer als die sechzig Zeilen hier. Er kann genau das, was das Formular
 * schickt: Felder und höchstens eine Datei.
 */

export function boundaryOf(contentType = '') {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) return null;
  return (match[1] ?? match[2]).trim();
}

/** Sammelt den Rumpf als Buffer und bricht über der Grenze ab. */
export async function readRawBody(req, limitBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('payload too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function splitOn(buffer, needle, from = 0) {
  const at = buffer.indexOf(needle, from);
  return at === -1 ? null : at;
}

/**
 * @returns {{ fields: Record<string,string>, files: Array<{name,filename,contentType,data}> }}
 */
export function parseMultipart(buffer, boundary) {
  const fields = {};
  const files = [];
  const delimiter = Buffer.from(`--${boundary}`);

  let cursor = splitOn(buffer, delimiter);
  if (cursor === null) return { fields, files };
  cursor += delimiter.length;

  while (cursor < buffer.length) {
    // Nach jedem Delimiter steht entweder CRLF (weiterer Teil) oder "--" (Ende).
    if (buffer.slice(cursor, cursor + 2).toString() === '--') break;
    const headerStart = cursor + 2;
    const headerEnd = splitOn(buffer, '\r\n\r\n', headerStart);
    if (headerEnd === null) break;

    const rawHeaders = buffer.slice(headerStart, headerEnd).toString('utf8');
    const bodyStart = headerEnd + 4;
    const next = splitOn(buffer, delimiter, bodyStart);
    if (next === null) break;
    const body = buffer.slice(bodyStart, next - 2); // das CRLF vor dem Delimiter weg

    const disposition = /content-disposition:([^\r\n]*)/i.exec(rawHeaders)?.[1] ?? '';
    const name = /name="([^"]*)"/i.exec(disposition)?.[1];
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1];
    const contentType = /content-type:\s*([^\r\n;]+)/i.exec(rawHeaders)?.[1]?.trim();

    if (name !== undefined) {
      if (filename !== undefined) {
        files.push({ name, filename, contentType: contentType ?? '', data: body });
      } else {
        fields[name] = body.toString('utf8');
      }
    }
    cursor = next + delimiter.length;
  }

  return { fields, files };
}
