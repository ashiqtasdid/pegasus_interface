import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: { [key: string]: string };
  created: Date;
}

export interface MinecraftServerOptions {
  serverId: string;
  serverName: string;
  port: number;
  maxPlayers: number;
  gameMode: string;
  difficulty: string;
  memoryLimit: string;
  plugins?: string[];
}

export class DockerService {
  private static readonly MINECRAFT_IMAGE = 'itzg/minecraft-server:latest';
  private static readonly CONTAINER_PREFIX = 'pegasus-mc-';
  private static readonly DATA_DIR = process.env.MINECRAFT_DATA_DIR || '/opt/minecraft-servers';

  /**
   * Check if Docker is available and running
   */
  static async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker info');
      return true;
    } catch (error) {
      console.error('Docker not available:', error);
      return false;
    }
  }

  /**
   * Create and start a new Minecraft server container
   */
  static async createMinecraftServer(options: MinecraftServerOptions): Promise<string> {
    const containerName = `${this.CONTAINER_PREFIX}${options.serverId}`;
    const serverDir = path.join(this.DATA_DIR, options.serverId);

    try {
      // Ensure server data directory exists
      await fs.mkdir(serverDir, { recursive: true });

      // Prepare environment variables
      const envVars = [
        'EULA=TRUE',
        `TYPE=VANILLA`,
        `VERSION=LATEST`,
        `MEMORY=${options.memoryLimit}`,
        `DIFFICULTY=${options.difficulty.toUpperCase()}`,
        `MODE=${options.gameMode.toUpperCase()}`,
        `MAX_PLAYERS=${options.maxPlayers}`,
        `MOTD=${options.serverName}`,
        `OVERRIDE_SERVER_PROPERTIES=true`,
        `ENABLE_RCON=true`,
        `RCON_PASSWORD=minecraft`,
        `RCON_PORT=25575`,
        `SERVER_PORT=25565`
      ];

      // Add plugin support if needed
      if (options.plugins && options.plugins.length > 0) {
        envVars.push(`TYPE=SPIGOT`);
        envVars.push(`SPIGET_RESOURCES=${options.plugins.join(',')}`);
      }

      // Build Docker run command
      const dockerArgs = [
        'run',
        '--name', containerName,
        '--detach',
        '--restart', 'unless-stopped',
        '-p', `${options.port}:25565`,
        '-p', `${options.port + 10}:25575`, // RCON port
        '-v', `${serverDir}:/data`,
        ...envVars.flatMap(env => ['-e', env]),
        this.MINECRAFT_IMAGE
      ];

      const { stdout } = await execAsync(`docker ${dockerArgs.join(' ')}`);
      const containerId = stdout.trim();

      console.log(`Created Minecraft server container: ${containerId}`);
      return containerId;
    } catch (error) {
      console.error('Error creating Minecraft server:', error);
      throw new Error(`Failed to create server container: ${error}`);
    }
  }

  /**
   * Start an existing container
   */
  static async startContainer(serverId: string): Promise<void> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      await execAsync(`docker start ${containerName}`);
      console.log(`Started container: ${containerName}`);
    } catch (error) {
      console.error('Error starting container:', error);
      throw new Error(`Failed to start container: ${error}`);
    }
  }

  /**
   * Stop a container
   */
  static async stopContainer(serverId: string): Promise<void> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      await execAsync(`docker stop ${containerName}`);
      console.log(`Stopped container: ${containerName}`);
    } catch (error) {
      console.error('Error stopping container:', error);
      throw new Error(`Failed to stop container: ${error}`);
    }
  }

  /**
   * Restart a container
   */
  static async restartContainer(serverId: string): Promise<void> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      await execAsync(`docker restart ${containerName}`);
      console.log(`Restarted container: ${containerName}`);
    } catch (error) {
      console.error('Error restarting container:', error);
      throw new Error(`Failed to restart container: ${error}`);
    }
  }

  /**
   * Remove a container and its data
   */
  static async removeContainer(serverId: string, removeData: boolean = false): Promise<void> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      // Stop container first
      await execAsync(`docker stop ${containerName}`).catch(() => {});
      
      // Remove container
      await execAsync(`docker rm ${containerName}`);
      
      // Remove data if requested
      if (removeData) {
        const serverDir = path.join(this.DATA_DIR, serverId);
        await fs.rm(serverDir, { recursive: true, force: true });
      }
      
      console.log(`Removed container: ${containerName}`);
    } catch (error) {
      console.error('Error removing container:', error);
      throw new Error(`Failed to remove container: ${error}`);
    }
  }

  /**
   * Get container information
   */
  static async getContainerInfo(serverId: string): Promise<DockerContainer | null> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      const { stdout } = await execAsync(
        `docker inspect ${containerName} --format '{{json .}}'`
      );
      
      const containerData = JSON.parse(stdout);
      
      return {
        id: containerData.Id,
        name: containerData.Name.replace('/', ''),
        image: containerData.Config.Image,
        status: containerData.State.Status,
        ports: this.parsePortMappings(containerData.NetworkSettings.Ports),
        created: new Date(containerData.Created)
      };
    } catch (error) {
      console.error('Error getting container info:', error);
      return null;
    }
  }

  /**
   * Execute command in container via RCON
   */
  static async executeCommand(serverId: string, command: string): Promise<string> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      // Use docker exec to run RCON command
      const { stdout } = await execAsync(
        `docker exec ${containerName} rcon-cli --host localhost --port 25575 --password minecraft "${command}"`
      );
      
      return stdout.trim();
    } catch (error) {
      console.error('Error executing command:', error);
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  /**
   * Get container logs
   */
  static async getContainerLogs(serverId: string, lines: number = 100): Promise<string[]> {
    const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
    
    try {
      const { stdout } = await execAsync(
        `docker logs --tail ${lines} ${containerName}`
      );
      
      return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Error getting container logs:', error);
      return [];
    }
  }

  /**
   * Get server statistics from container
   */
  static async getServerStats(serverId: string): Promise<{
    playerCount: number;
    onlinePlayers: string[];
    uptime: number;
    memory: { used: number; max: number };
    cpu: number;
  }> {
    try {
      // Get player list via RCON
      const playerList = await this.executeCommand(serverId, 'list');
      const players = this.parsePlayerList(playerList);
      
      // Get container stats
      const containerName = `${this.CONTAINER_PREFIX}${serverId}`;
      const { stdout } = await execAsync(
        `docker stats ${containerName} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}"`
      );
      
      const statsLines = stdout.trim().split('\n');
      const statsData = statsLines[1]?.split('\t') || ['0%', '0B / 0B'];
      
      const cpuPerc = parseFloat(statsData[0]?.replace('%', '') || '0');
      const memoryParts = statsData[1]?.split(' / ') || ['0B', '0B'];
      const memUsed = this.parseMemoryString(memoryParts[0]);
      const memMax = this.parseMemoryString(memoryParts[1]);
      
      // Get uptime from container info
      const containerInfo = await this.getContainerInfo(serverId);
      const uptime = containerInfo ? 
        Math.floor((Date.now() - containerInfo.created.getTime()) / 1000) : 0;
      
      return {
        playerCount: players.length,
        onlinePlayers: players,
        uptime,
        memory: { used: memUsed, max: memMax },
        cpu: cpuPerc
      };
    } catch (error) {
      console.error('Error getting server stats:', error);
      return {
        playerCount: 0,
        onlinePlayers: [],
        uptime: 0,
        memory: { used: 0, max: 0 },
        cpu: 0
      };
    }
  }

  /**
   * Check if container is healthy
   */
  static async isContainerHealthy(serverId: string): Promise<boolean> {
    try {
      const containerInfo = await this.getContainerInfo(serverId);
      return containerInfo?.status === 'running';
    } catch (error) {
      return false;
    }
  }

  /**
   * List all Minecraft containers
   */
  static async listMinecraftContainers(): Promise<DockerContainer[]> {
    try {
      const { stdout } = await execAsync(
        `docker ps -a --filter "name=${this.CONTAINER_PREFIX}" --format "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"`
      );
      
      const containers: DockerContainer[] = [];
      const lines = stdout.trim().split('\n').filter(line => line);
      
      for (const line of lines) {
        const [id, name, image, status, ports, created] = line.split('\t');
        containers.push({
          id,
          name,
          image,
          status,
          ports: this.parsePortString(ports),
          created: new Date(created)
        });
      }
      
      return containers;
    } catch (error) {
      console.error('Error listing containers:', error);
      return [];
    }
  }

  /**
   * Clean up stopped containers
   */
  static async cleanupStoppedContainers(): Promise<void> {
    try {
      await execAsync(
        `docker container prune --filter "label=minecraft-server" --force`
      );
      console.log('Cleaned up stopped Minecraft containers');
    } catch (error) {
      console.error('Error cleaning up containers:', error);
    }
  }

  // Helper methods
  private static parsePortMappings(ports: any): { [key: string]: string } {
    const mappings: { [key: string]: string } = {};
    
    if (ports) {
      Object.keys(ports).forEach(port => {
        if (ports[port] && ports[port][0]) {
          mappings[port] = ports[port][0].HostPort;
        }
      });
    }
    
    return mappings;
  }

  private static parsePortString(portString: string): { [key: string]: string } {
    const mappings: { [key: string]: string } = {};
    
    // Parse port format like "0.0.0.0:25565->25565/tcp"
    const portRegex = /(\d+\.\d+\.\d+\.\d+):(\d+)->(\d+)\/\w+/g;
    let match;
    
    while ((match = portRegex.exec(portString)) !== null) {
      mappings[`${match[3]}/tcp`] = match[2];
    }
    
    return mappings;
  }
  public static parsePlayerList(playerListOutput: string): string[] {
    // Parse output like "There are 2/20 players online: Player1, Player2"
    const match = playerListOutput.match(/players online: (.+)$/);
    if (match && match[1] && match[1] !== '') {
      return match[1].split(', ').map(name => name.trim());
    }
    return [];
  }

  private static parseMemoryString(memStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    const match = memStr.match(/^([\d.]+)([A-Z]+)$/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      return value * (units[unit] || 1);
    }
    
    return 0;
  }
}
