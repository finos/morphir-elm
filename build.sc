import $meta._
import $ivy.`io.github.alexarchambault.mill::mill-native-image::0.1.26`
import io.github.alexarchambault.millnativeimage.NativeImage

import mill.main.RootModule
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

    object morphir extends Module {
        object lang extends Module {
            object elm extends ScalaProject{}
        }
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
