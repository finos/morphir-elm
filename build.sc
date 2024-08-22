import mill.define.ExternalModule
import mill.main.RootModule
import $meta._
import mill._, mill.scalalib._

object root extends RootModule {    

    def isCI = T.input {
        val result = sys.env.getOrElse("CI", "false")
        Seq("true","1","yes").contains(result) 
    }

    def gulp(steps: String*) = T.command {        
        for (step <- steps) {
            println(s"Running gulp $step")
        }
    }    

    def npmInstall() = T.command {
        val installSubCommand = isCI() match {
            case true => "ci"
            case false => "install"
        }
        os.proc("npm", installSubCommand).call()
    }

    def setup() = T.command {
        npmInstall()
    }

    object ci extends RootModule {
    
    }



    trait ScalaProject extends ScalaModule {
        def scalaVersion = V.Scala.defaultScalaVersion
    }
}


object V {
    object Scala {        
        val scala3x = "3.3.3"
        val defaultScalaVersion = scala3x
    }
}

object CI extends ExternalModule