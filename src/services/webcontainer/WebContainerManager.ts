import { WebContainer } from '@webcontainer/api';
import { type FileSystemTree } from '../../types';

export class WebContainerManager {
  private static instance: WebContainerManager;
  private webcontainerInstance: WebContainer | null = null;

  private constructor() {}

  public static async getInstance(): Promise<WebContainerManager> {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    if (!WebContainerManager.instance.webcontainerInstance) {
      await WebContainerManager.instance.boot();
    }
    return WebContainerManager.instance;
  }

  public async boot(): Promise<WebContainer> {
    if (this.webcontainerInstance) return this.webcontainerInstance;

    console.log('Booting WebContainer...');
    this.webcontainerInstance = await WebContainer.boot();
    return this.webcontainerInstance;
  }

  public async mount(tree: FileSystemTree) {
    if (!this.webcontainerInstance) await this.boot();
    await this.webcontainerInstance!.mount(tree);
  }

  public async install(onLog?: (data: string) => void) {
    if (!this.webcontainerInstance) {
      await this.boot();
    }

    const installProcess = await this.webcontainerInstance!.spawn('npm', ['install']);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onLog?.(data);
        },
      })
    );

    return installProcess.exit;
  }

  public async runDev(onLog?: (data: string) => void, onReady?: (url: string) => void) {
    if (!this.webcontainerInstance) {
      await this.boot();
    }

    const devProcess = await this.webcontainerInstance!.spawn('npm', ['run', 'dev']);

    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onLog?.(data);
        },
      })
    );

    this.webcontainerInstance!.on('server-ready', (_port, url) => {
      onReady?.(url);
    });

    return devProcess;
  }

  public async writeFile(path: string, content: string) {
    if (!this.webcontainerInstance) {
      await this.boot();
    }
    await this.webcontainerInstance!.fs.writeFile(path, content);
  }

  public async readFile(path: string): Promise<string> {
    if (!this.webcontainerInstance) {
      await this.boot();
    }
    const content = await this.webcontainerInstance!.fs.readFile(path);
    return new TextDecoder().decode(content);
  }
}
